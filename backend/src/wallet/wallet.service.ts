import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Prisma,
  TopUpOrderStatus,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@prisma/client';
import StripeConstructor = require('stripe');
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateStripeTopUpDto,
  MAX_CUSTOM_TOP_UP_RM,
  MIN_CUSTOM_TOP_UP_RM,
  TopUpPackageCode,
} from './dto/create-stripe-top-up.dto';

const STRIPE_API_VERSION = '2026-04-22.dahlia';

const TOP_UP_PACKAGES: Record<
  TopUpPackageCode,
  { amountRm: number; credits: number; label: string }
> = {
  RM50: { amountRm: 50, credits: 50, label: 'RM50 Wallet Top-Up' },
  RM100: { amountRm: 100, credits: 100, label: 'RM100 Wallet Top-Up' },
  RM200: { amountRm: 200, credits: 210, label: 'RM200 Wallet Top-Up' },
  RM500: { amountRm: 500, credits: 550, label: 'RM500 Wallet Top-Up' },
};

type ResolvedTopUp = {
  packageCode: TopUpPackageCode | null;
  amountRm: number;
  credits: number;
  label: string;
  description: string;
  isCustom: boolean;
};

@Injectable()
export class WalletService {
  private stripeClient: StripeConstructor.Stripe | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getWalletSummary(userId: string) {
    const wallet = await this.ensureWallet(userId);

    return {
      id: wallet.id,
      balance: Number(wallet.balance),
      currency: wallet.currency,
      updatedAt: wallet.updatedAt,
    };
  }

  async getTransactions(userId: string) {
    const wallet = await this.ensureWallet(userId);
    const transactions = await this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        booking: { select: { id: true, bookingReference: true } },
        topUpOrder: {
          select: {
            id: true,
            packageCode: true,
            isCustom: true,
            status: true,
            stripeSessionId: true,
          },
        },
      },
    });

    return transactions.map((transaction) => ({
      ...transaction,
      amount: Number(transaction.amount),
      balanceBefore: Number(transaction.balanceBefore),
      balanceAfter: Number(transaction.balanceAfter),
    }));
  }

  async createStripeCheckoutSession(userId: string, dto: CreateStripeTopUpDto) {
    const topUp = this.resolveTopUpRequest(dto);
    const wallet = await this.ensureWallet(userId);
    const stripe = this.getStripeClient();
    const frontendUrl = this.getFrontendUrl();

    const topUpOrder = await this.prisma.topUpOrder.create({
      data: {
        userId,
        walletId: wallet.id,
        packageCode: topUp.packageCode,
        isCustom: topUp.isCustom,
        amountRm: new Prisma.Decimal(topUp.amountRm),
        credits: new Prisma.Decimal(topUp.credits),
        currency: 'MYR',
        status: TopUpOrderStatus.PENDING,
      },
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: topUpOrder.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'myr',
            unit_amount: topUp.amountRm * 100,
            product_data: {
              name: topUp.label,
              description: topUp.description,
            },
          },
        },
      ],
      metadata: {
        topUpOrderId: topUpOrder.id,
        userId,
        packageCode: topUp.packageCode || 'CUSTOM',
        isCustom: String(topUp.isCustom),
        credits: String(topUp.credits),
      },
      success_url: `${frontendUrl}/wallet/top-up/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/wallet/top-up/cancel`,
    });

    const updatedOrder = await this.prisma.topUpOrder.update({
      where: { id: topUpOrder.id },
      data: {
        stripeSessionId: session.id,
        checkoutUrl: session.url,
      },
    });

    return {
      topUpOrderId: updatedOrder.id,
      status: updatedOrder.status,
      checkoutUrl: session.url,
    };
  }

  async getTopUpOrder(userId: string, idOrSessionId: string) {
    const order = await this.prisma.topUpOrder.findFirst({
      where: {
        userId,
        OR: [{ id: idOrSessionId }, { stripeSessionId: idOrSessionId }],
      },
      include: { walletTransaction: true },
    });

    if (!order) {
      throw new NotFoundException('Top-up order not found');
    }

    return {
      id: order.id,
      status: order.status,
      packageCode: order.packageCode,
      isCustom: order.isCustom,
      amountRm: Number(order.amountRm),
      credits: Number(order.credits),
      stripeSessionId: order.stripeSessionId,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      walletTransaction: order.walletTransaction
        ? {
            id: order.walletTransaction.id,
            status: order.walletTransaction.status,
            amount: Number(order.walletTransaction.amount),
            balanceAfter: Number(order.walletTransaction.balanceAfter),
            createdAt: order.walletTransaction.createdAt,
          }
        : null,
    };
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string | undefined) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET')?.trim();
    if (!webhookSecret) {
      throw new BadRequestException(
        'STRIPE_WEBHOOK_SECRET is not configured. Run stripe listen and copy the whsec value into backend/.env.',
      );
    }

    if (!signature) {
      throw new BadRequestException('Missing Stripe signature header');
    }

    if (!Buffer.isBuffer(rawBody)) {
      throw new BadRequestException('Stripe webhook requires a raw request body');
    }

    let event: any;
    try {
      event = this.getStripeClient().webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown webhook error';
      throw new BadRequestException(`Stripe webhook signature verification failed: ${message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await this.creditWalletForCompletedCheckoutSession(session);
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      await this.markTopUpOrderExpired(session.id);
    }

    return { received: true, eventType: event.type };
  }

  private async ensureWallet(userId: string) {
    return this.prisma.wallet.upsert({
      where: { userId },
      create: { userId, balance: new Prisma.Decimal(0), currency: 'MYR' },
      update: {},
    });
  }

  private getStripeClient() {
    if (this.stripeClient) {
      return this.stripeClient;
    }

    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY')?.trim();
    if (!secretKey) {
      throw new ServiceUnavailableException('STRIPE_SECRET_KEY is not configured');
    }

    this.stripeClient = new StripeConstructor(secretKey, {
      apiVersion: STRIPE_API_VERSION,
    });

    return this.stripeClient;
  }

  private getFrontendUrl() {
    return (
      this.configService.get<string>('FRONTEND_URL')?.trim() ||
      'http://localhost:3000'
    ).replace(/\/+$/, '');
  }

  private async creditWalletForCompletedCheckoutSession(
    session: any,
  ) {
    if (session.payment_status !== 'paid') {
      return;
    }

    const topUpOrderId = session.metadata?.topUpOrderId;
    const paymentIntentId = this.getPaymentIntentId(session.payment_intent);

    const order = await this.prisma.topUpOrder.findFirst({
      where: {
        OR: [
          ...(topUpOrderId ? [{ id: topUpOrderId }] : []),
          { stripeSessionId: session.id },
        ],
      },
    });

    if (!order) {
      throw new NotFoundException('Matching wallet top-up order not found');
    }

    await this.prisma.$transaction(async (prisma) => {
      const paidOrder = await prisma.topUpOrder.updateMany({
        where: { id: order.id, status: TopUpOrderStatus.PENDING },
        data: {
          status: TopUpOrderStatus.PAID,
          stripeSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
          paidAt: new Date(),
        },
      });

      if (paidOrder.count === 0) {
        return;
      }

      await prisma.wallet.update({
        where: { id: order.walletId },
        data: { balance: { increment: order.credits } },
      });

      const updatedWallet = await prisma.wallet.findUniqueOrThrow({
        where: { id: order.walletId },
      });
      const balanceAfter = updatedWallet.balance;
      const balanceBefore = balanceAfter.sub(order.credits);

      await prisma.walletTransaction.create({
        data: {
          walletId: order.walletId,
          userId: order.userId,
          topUpOrderId: order.id,
          type: WalletTransactionType.TOP_UP,
          status: WalletTransactionStatus.SUCCESS,
          amount: order.credits,
          balanceBefore,
          balanceAfter,
          description: order.isCustom
            ? `Stripe custom top-up RM${Number(order.amountRm).toFixed(0)}`
            : `Stripe top-up ${order.packageCode}`,
          reference: session.id,
        },
      });
    });
  }

  private async markTopUpOrderExpired(stripeSessionId: string) {
    await this.prisma.topUpOrder.updateMany({
      where: { stripeSessionId, status: TopUpOrderStatus.PENDING },
      data: { status: TopUpOrderStatus.EXPIRED },
    });
  }

  private getPaymentIntentId(
    paymentIntent: string | { id: string } | null,
  ) {
    if (!paymentIntent) {
      return null;
    }

    return typeof paymentIntent === 'string' ? paymentIntent : paymentIntent.id;
  }

  private resolveTopUpRequest(dto: CreateStripeTopUpDto): ResolvedTopUp {
    const hasPackageCode = dto.packageCode !== undefined && dto.packageCode !== null;
    const hasCustomAmount =
      dto.customAmount !== undefined && dto.customAmount !== null;

    if (hasPackageCode && hasCustomAmount) {
      throw new BadRequestException(
        'Provide either packageCode or customAmount, not both',
      );
    }

    if (!hasPackageCode && !hasCustomAmount) {
      throw new BadRequestException(
        'Provide either packageCode or customAmount',
      );
    }

    if (hasPackageCode) {
      const packageConfig = TOP_UP_PACKAGES[dto.packageCode as TopUpPackageCode];
      if (!packageConfig) {
        throw new BadRequestException('Unsupported wallet top-up package');
      }

      return {
        packageCode: dto.packageCode as TopUpPackageCode,
        amountRm: packageConfig.amountRm,
        credits: packageConfig.credits,
        label: packageConfig.label,
        description: `${packageConfig.credits} Repok wallet credits`,
        isCustom: false,
      };
    }

    const customAmount = dto.customAmount;
    if (
      typeof customAmount !== 'number' ||
      !Number.isFinite(customAmount) ||
      Number.isNaN(customAmount)
    ) {
      throw new BadRequestException('Custom top-up amount is required');
    }

    if (!Number.isInteger(customAmount)) {
      throw new BadRequestException(
        'Custom top-up amount must be a whole number in RM',
      );
    }

    if (customAmount < MIN_CUSTOM_TOP_UP_RM) {
      throw new BadRequestException('Minimum custom top-up is RM10');
    }

    if (customAmount > MAX_CUSTOM_TOP_UP_RM) {
      throw new BadRequestException('Maximum custom top-up is RM2000');
    }

    return {
      packageCode: null,
      amountRm: customAmount,
      credits: customAmount,
      label: `Repok Wallet Top-up - RM${customAmount}`,
      description: `${customAmount} Repok wallet credits. Custom top-ups do not include bonus credits.`,
      isCustom: true,
    };
  }
}
