import type {
  DevicePaymentProfile,
  GatewayProviderId,
  IPaymentGateway,
} from '../../types/paymentGateway';
import { tuuPaymentGateway } from './TuuPaymentGateway';

const registry: Record<GatewayProviderId, IPaymentGateway> = {
  tuu: tuuPaymentGateway,
  webpay: {
    id: 'webpay',
    displayName: 'Webpay',
    async isAvailable() {
      return false;
    },
    async startCardPayment() {
      throw new Error('Webpay no implementado (Sprint 2)');
    },
  },
  mock: {
    id: 'mock',
    displayName: 'Mock',
    async isAvailable() {
      return false;
    },
    async startCardPayment() {
      throw new Error('MockPaymentGateway pendiente (COD-03)');
    },
  },
};

export class PaymentGatewayFactory {
  static getGateway(id: GatewayProviderId): IPaymentGateway | null {
    return registry[id] ?? null;
  }

  static async getAvailableGateways(
    allowedIds: GatewayProviderId[],
  ): Promise<IPaymentGateway[]> {
    const gateways: IPaymentGateway[] = [];
    for (const id of allowedIds) {
      const gateway = registry[id];
      if (!gateway) continue;
      if (await gateway.isAvailable()) {
        gateways.push(gateway);
      }
    }
    return gateways;
  }

  static async getDefaultCardGateway(
    profile: DevicePaymentProfile | null,
    availableGatewayIds: GatewayProviderId[],
  ): Promise<IPaymentGateway | null> {
    if (profile === 'TUU_KOZEN' && availableGatewayIds.includes('tuu')) {
      const tuu = registry.tuu;
      if (await tuu.isAvailable()) {
        return tuu;
      }
    }
    const available = await PaymentGatewayFactory.getAvailableGateways(availableGatewayIds);
    return available[0] ?? null;
  }
}
