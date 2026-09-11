import type {
  DevicePaymentProfile,
  GatewayProviderId,
  IPaymentGateway,
} from '../../types/paymentGateway';
import { mockPaymentGateway } from './MockPaymentGateway';
import { tuuPaymentGateway } from './TuuPaymentGateway';
import { webpayPaymentGateway } from './WebpayPaymentGateway';

const registry: Record<GatewayProviderId, IPaymentGateway> = {
  tuu: tuuPaymentGateway,
  webpay: webpayPaymentGateway,
  mock: mockPaymentGateway,
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
    const available = await PaymentGatewayFactory.getAvailableGateways(availableGatewayIds);
    if (available.length === 0) {
      return null;
    }
    if (available.length === 1) {
      return available[0];
    }

    if (profile === 'TUU_KOZEN') {
      const tuu = available.find(g => g.id === 'tuu');
      if (tuu) return tuu;
    }

    if (profile === 'GENERIC_MOBILE') {
      const webpay = available.find(g => g.id === 'webpay');
      if (webpay) return webpay;
      const mock = available.find(g => g.id === 'mock');
      if (mock) return mock;
    }

    return available[0];
  }

  /** HU-04: pasarelas disponibles para UI (nombre + id). */
  static async listAvailableForProfile(
    profile: DevicePaymentProfile | null,
    availableGatewayIds: GatewayProviderId[],
  ): Promise<IPaymentGateway[]> {
    return PaymentGatewayFactory.getAvailableGateways(availableGatewayIds);
  }
}
