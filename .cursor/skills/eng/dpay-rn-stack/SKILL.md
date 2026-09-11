---
name: dpay-rn-stack
description: Convenciones React Native 0.75 + TypeScript D-PAY — Zustand, MMKV, pantallas de pago, tema, estructura src/. Usar al desarrollar screens, components, stores, services en codigo/, o HU frontend.
metadata:
  layer: project
  project: dpay-3.0
  version: "1.0.0"
paths:
  - "**/*.tsx"
  - "**/*.ts"
  - "**/screens/**"
  - "**/components/**"
  - "**/stores/**"
  - "**/services/**"
---

# D-PAY — Stack React Native

## Stack

- React Native **0.75.5** + TypeScript
- **Zustand** — estado global (stores en `src/stores/`)
- **MMKV** — persistencia; **no** AsyncStorage para tokens/credenciales
- Tema existente — reutilizar `theme/`, no paleta nueva en HU-04

## Estructura (respetar)

```
src/
├── screens/       # UI flujos
├── components/    # Reutilizables
├── stores/        # Zustand
├── services/      # Integración, API, pagos
├── utils/
└── types/
```

## Stores clave

| Store | Uso |
|---|---|
| `authStore` | Sesión, tokens |
| `salesStore` | Ventas, estado pago |
| `settingsStore` | Detección dispositivo (HU-01) |
| `paymentHubStore` | Hub pagos |

## Patrones UI pago

- Tres estados explícitos: pendiente, aprobado, rechazado/error
- Loading/error boundaries — sin dejar venta ambigua
- Consumir `PaymentGateway` vía factory, no imports directos SDK

## TypeScript

- Tipos estrictos en flujos de pago
- Evitar `any` en respuestas API
- Reutilizar types en `src/types/`

## Performance / UX

- No recalcular detección dispositivo cada pantalla
- Memoización donde el repo ya la usa — no prematura

## No hacer

- ❌ Docker, NFC/SoftPOS (fuera alcance)
- ❌ Nuevo state manager
- ❌ Lógica pasarela en screen

## Debug

Orden Webpay/TUU → `eng-debugging`

## Backend

Solo endpoints Dtemite — rule `01-dev-frontend`, `eng-api-design`
