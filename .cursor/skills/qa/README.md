# Skills QA — D-PAY 3.0 (proyecto)

Skills de dominio para el repositorio `dpay_3.0`. Complementan las **rules** en `.cursor/rules/` y los **skills globales** en `~/.cursor/skills/qa/`.

## Instalación en el repo

Copiar esta carpeta al clon del equipo:

```
dpay_3.0/
└── .cursor/
    ├── rules/          ← desde dpay-cursor-skills/.cursor/rules/
    └── skills/
        └── qa/         ← esta carpeta
```

O ejecutar desde `qa-skills-framework`:

```powershell
.\install-project-dpay.ps1 -TargetRepo "C:\Users\NEKODev\Documents\CAPSTONE\dpay_3.0"
```

## Skills incluidos

| Skill | Uso |
|---|---|
| `dpay-hu06-execution` | Ejecutar escenarios obligatorios HU-06 |
| `dpay-payment-gateway-regression` | Regresión tras cambios en pagos |
| `dpay-acceptance-criteria` | Checklist de cierre por HU (`/dpay-acceptance-criteria`) |

## Dependencias globales

Instalar una vez en el PC:

```powershell
cd ..\qa-skills-framework
.\install-global.ps1
```

## Trazabilidad Capstone

RF-N01→HU-01 … RF-N05→HU-06. Los RNF son DoD transversal, no HU independientes.
