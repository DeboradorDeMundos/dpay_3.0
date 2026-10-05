import type {
  DevicePaymentProfile,
  GatewayProviderId,
  IPaymentGateway,
} from '../../types/paymentGateway';
import { mockPaymentGateway } from './MockPaymentGateway';
import { tuuPaymentGateway } from './TuuPaymentGateway';
import { webpayPaymentGateway } from './WebpayPaymentGateway';
import {
  isCashOnlyPaymentNetwork,
  resolveCurrentWebpayAccess,
} from './webpayProxyConfig';

/**
 * Adapters concretos. Una pasarela nueva (Flow, Mercado Pago u otra) se
 * registra aquí junto a su GatewayProviderId; la pantalla de venta no cambia.
 */
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
    const checks = await Promise.all(
      allowedIds.map(async id => {
        const gateway = registry[id];
        if (!gateway) return null;
        return (await gateway.isAvailable()) ? gateway : null;
      }),
    );
    return checks.filter((gateway): gateway is IPaymentGateway => gateway !== null);
  }

  /** TUU solo en terminal Kozen con app instalada. */
  static async getAvailableGatewaysForProfile(
    profile: DevicePaymentProfile | null,
    allowedIds: GatewayProviderId[],
  ): Promise<IPaymentGateway[]> {
    // Celular genérico: efectivo solo sin WWAN, WLAN ni LAN. No por no ser Kozen.
    if (profile !== 'TUU_KOZEN') {
      const access = await resolveCurrentWebpayAccess();
      if (isCashOnlyPaymentNetwork(access)) {
        return [];
      }
    }
    const ids =
      profile === 'TUU_KOZEN'
        ? allowedIds
        : allowedIds.filter(id => id !== 'tuu');
    return PaymentGatewayFactory.getAvailableGateways(ids);
  }

  static async getDefaultCardGateway(
    profile: DevicePaymentProfile | null,
    availableGatewayIds: GatewayProviderId[],
  ): Promise<IPaymentGateway | null> {
    const available = await PaymentGatewayFactory.getAvailableGatewaysForProfile(
      profile,
      availableGatewayIds,
    );
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

  /**
   * Conserva la pasarela que eligió el cajero si sigue disponible.
   * Si no, usa la preselección (una sola opción o prioridad Webpay/TUU).
   */
  static keepUserSelection(
    availableIds: GatewayProviderId[],
    previous: GatewayProviderId | null,
    fallback: GatewayProviderId | null,
  ): GatewayProviderId | null {
    if (previous && availableIds.includes(previous)) {
      return previous;
    }
    if (fallback && availableIds.includes(fallback)) {
      return fallback;
    }
    return availableIds[0] ?? null;
  }

  /** HU-04: pasarelas disponibles para UI (nombre + id). */
  static async listAvailableForProfile(
    profile: DevicePaymentProfile | null,
    availableGatewayIds: GatewayProviderId[],
  ): Promise<IPaymentGateway[]> {
    return PaymentGatewayFactory.getAvailableGatewaysForProfile(
      profile,
      availableGatewayIds,
    );
  }
}
