![Un dibujo con letras  Descripción generada automáticamente con confianza media](data:image/jpeg;base64...)

**INFORME AUTOEVALUACIÓN**

**D-PAY**

**Una nueva forma de Pagar**

Contenido

[**Abstract (Español)** 3](#_Toc238926594)

[**Abstract (English)** 3](#_Toc238926595)

[**Descripción del Proyecto APT** 4](#_Toc238926596)

[**Relación del Proyecto APT con las Competencias del Perfil de Egreso** 4](#_Toc238926597)

[**Relación del Proyecto con mis Intereses Profesionales** 5](#_Toc238926598)

[**Argumento de Factibilidad del Proyecto** 5](#_Toc238926599)

[**Objetivos** 6](#_Toc238926600)

[**Objetivo General** 6](#_Toc238926601)

[**Objetivos Específicos** 6](#_Toc238926602)

[**Propuesta Metodológica de Trabajo** 6](#_Toc238926603)

[**Plan de Trabajo para el Proyecto APT** 7](#_Toc238926604)

[**Propuesta de Evidencias** 7](#_Toc238926605)

[**Conclusions** 8](#_Toc238926606)

[**Reflection** 8](#_Toc238926607)

**Autoevaluación Definición Proyecto APT — Fase 1**

*Reinhartd Munzenmayer · PTY4614 Capstone, Sección 001 · Proyecto D-PAY 3.0*

# **Abstract (Español)**

El presente proyecto de título, denominado D-PAY 3.0, se desarrolla en conjunto con la empresa Dtemite y consiste en la evolución del sistema de punto de venta móvil D-PAY, actualmente en producción, desde una arquitectura de pagos dependiente de hardware de terminal (TUU/Kozen) hacia un modelo de pasarelas de pago extensible y desacoplado. El aporte técnico central es el diseño e implementación de una arquitectura multi-gateway que permite incorporar nuevos medios de pago sin reescribir la lógica de negocio existente, utilizando Webpay como implementación mínima viable (MVP) y dejando documentadas en el backlog las integraciones futuras con Flow, MercadoLibre y PayPal. El proyecto se gestiona bajo la metodología Agile Scrum, con un equipo de tres integrantes, y se desarrolla en tres fases a lo largo del semestre. Este documento constituye la autoevaluación individual correspondiente a la Fase 1, en la que se define el proyecto, se justifica su factibilidad y se establece la planificación de trabajo.

# **Abstract (English)**

This capstone project, D-PAY 3.0, is developed together with the company Dtemite and consists of evolving the mobile point-of-sale system D-PAY, currently in production, from a hardware-dependent terminal payment architecture (TUU/Kozen) into an extensible, decoupled multi-gateway payment model. The core technical contribution is the design and implementation of an architecture that allows new payment methods to be added without rewriting existing business logic, using Webpay as the minimum viable product (MVP) and documenting future integrations with Flow, MercadoLibre and PayPal in the product backlog. The project is managed under the Agile Scrum methodology, with a three-member team, and is developed across three phases throughout the semester. This document is the individual self-assessment for Phase 1, covering the project definition, its feasibility, and the work plan.

# **Descripción del Proyecto APT**

D-PAY 3.0 es un proyecto de título orientado a evolucionar D-PAY, un sistema de punto de venta (POS) móvil ya utilizado en producción por la empresa Dtemite, cuyo contacto principal es José Robles Rocha. Actualmente, D-PAY procesa pagos exclusivamente a través de terminales físicos de las marcas TUU y Kozen, lo que limita su flexibilidad comercial y lo hace dependiente de un proveedor de hardware específico.

El proyecto busca resolver esta limitación diseñando una capa de arquitectura de pagos extensible, que permita integrar múltiples pasarelas de pago digitales bajo un mismo estándar interno, sin depender de hardware. Como implementación mínima viable (MVP) del semestre se desarrolla la integración con Webpay (Transbank), mientras que las integraciones con Flow, MercadoLibre y PayPal quedan documentadas como parte del backlog priorizado para etapas futuras. El equipo de desarrollo está compuesto por Diego Madrid, Pablo Gutiérrez y Reinhartd Munzenmayer, y el proyecto se gestiona mediante la metodología Agile Scrum.

# **Relación del Proyecto APT con las Competencias del Perfil de Egreso**

El proyecto D-PAY 3.0 se relaciona directamente con al menos tres competencias del perfil de egreso de Ingeniería en Informática:

* Gestionar proyectos informáticos, ofreciendo alternativas para la toma de decisiones de acuerdo con los requerimientos de la organización: se aplica mediante la planificación y control del proyecto bajo Scrum, con Product Backlog priorizado, sprints y ceremonias definidas, entregando a Dtemite una hoja de ruta clara para decidir qué pasarela de pago priorizar según sus necesidades comerciales.
* Desarrollar una solución de software utilizando técnicas que permitan sistematizar el proceso de desarrollo y mantenimiento, asegurando el logro de los objetivos: se evidencia en la construcción e integración del módulo de pago Webpay dentro de la arquitectura existente de D-PAY, aplicando control de versiones mediante Git/GitHub, ramas de feature y Pull Requests, sin intervenir directamente la rama principal.
* Construir modelos de datos para soportar los requerimientos de la organización de acuerdo a un diseño definido y escalable en el tiempo: se refleja en el diseño de la arquitectura multi-gateway, pensada explícitamente para que nuevos medios de pago puedan añadirse en el futuro sin modificar la lógica de negocio central.

# **Relación del Proyecto con mis Intereses Profesionales**

Mi interés profesional principal dentro de la Ingeniería en Informática está orientado al desarrollo y la arquitectura en la nube, así como al uso correcto de inteligencia artificial —agentes y skills— como herramienta de apoyo al desarrollo de software. Si bien D-PAY 3.0 no es un proyecto cloud en sí mismo, la forma en que se aborda técnicamente sí conecta con este interés: el diseño de una arquitectura multi-gateway desacoplada y extensible sigue los mismos principios que se aplican en el diseño de sistemas cloud-native (bajo acoplamiento, extensibilidad, independencia de proveedor), por lo que este proyecto me permite ejercitar ese tipo de pensamiento arquitectónico aplicado a un dominio distinto, el de los pagos.

Adicionalmente, incorporé activamente el uso de agentes de inteligencia artificial como parte de mi flujo de trabajo individual dentro del proyecto: utilicé un asistente de IA como guía técnica senior para estructurar la documentación del Capstone, generando los entregables mediante un pipeline propio basado en Node.js y la librería docx, con conversión a PDF y revisión visual antes de la entrega. Esto me permite desarrollar experiencia práctica real en el uso de IA aplicada al trabajo profesional, que es exactamente el área en la que busco especializarme a futuro.

# **Argumento de Factibilidad del Proyecto**

El proyecto es factible de realizar en el marco de la asignatura por las siguientes razones:

* Se trata de una evolución de un sistema ya existente y en producción (D-PAY), y no de un desarrollo desde cero, lo que reduce el riesgo técnico y acota el tiempo necesario para levantar el contexto del sistema.
* El alcance del semestre se limita a un único gateway de pago (Webpay) como MVP, dejando el resto de las integraciones (Flow, MercadoLibre, PayPal) documentadas en el backlog para etapas posteriores, lo que permite un avance incremental y verificable dentro de los tiempos del curso.
* El equipo cuenta con tres integrantes con roles y flujo de trabajo Git ya definidos (ramas de feature, Pull Requests, sin intervención directa de la rama main), lo que reduce el riesgo de conflictos o pérdida de trabajo durante el desarrollo.
* Existe una empresa mandante (Dtemite) con un contacto validado (José Robles Rocha), lo que asegura retroalimentación real sobre los requerimientos del negocio.
* Como posible dificultad se identifica la eventual demora en la confirmación de los roles de Product Owner y Scrum Master por parte de Dtemite; se aborda dando seguimiento activo a esa definición durante las primeras semanas del proyecto.

# **Objetivos**

## **Objetivo General**

Diseñar e implementar una arquitectura de pagos extensible para el sistema D-PAY, que permita incorporar múltiples pasarelas de pago digitales de forma desacoplada, utilizando Webpay como implementación mínima viable durante el semestre.

## **Objetivos Específicos**

* Levantar y documentar la arquitectura de pagos actual de D-PAY, identificando su dependencia del hardware de terminal (TUU/Kozen).
* Diseñar un modelo de arquitectura multi-gateway que desacople la lógica de negocio de la implementación específica de cada pasarela de pago.
* Implementar la integración con Webpay como MVP funcional dentro de la aplicación D-PAY.
* Documentar en el Product Backlog las integraciones futuras con Flow, MercadoLibre y PayPal como trabajo pendiente para etapas posteriores.
* Gestionar el desarrollo del proyecto aplicando la metodología Agile Scrum, con sprints, backlog priorizado y ceremonias definidas.

# **Propuesta Metodológica de Trabajo**

El proyecto se gestiona mediante la metodología Agile Scrum, adecuada dado el tamaño reducido del equipo (tres integrantes), la necesidad de iterar rápidamente sobre un sistema ya existente, y la posibilidad de recibir retroalimentación frecuente de la empresa mandante. El trabajo se organiza en un Product Backlog priorizado (Historias de Usuario HU-01 a HU-08), del cual se desprenden los sprints planificados para cada fase del curso. Se contemplan las ceremonias propias de Scrum —Sprint Planning, Daily Scrum, Sprint Review y Sprint Retrospective— y se definirán junto a Dtemite los roles de Product Owner y Scrum Master, mientras que el Development Team está conformado por los tres integrantes del equipo.

El control de versiones se realiza mediante Git y GitHub, con un flujo de trabajo basado en ramas de feature y Pull Requests revisados antes de integrarse a la rama principal, lo que asegura la trazabilidad de los cambios y evita afectar directamente el código en producción.

# **Plan de Trabajo para el Proyecto APT**

El plan de trabajo se organiza en tres fases a lo largo del semestre, alineadas con la estructura del curso Capstone:

* Fase 1: definición del proyecto, Product Vision, Product Backlog priorizado y documentación individual (autoevaluación de competencias, diario de reflexión y esta autoevaluación de Fase 1).
* Fase 2: desarrollo e implementación de la integración con Webpay, avance de los sprints definidos y actualización de la documentación técnica del repositorio.
* Fase 3: cierre del proyecto, pruebas finales, documentación de resultados y entrega final.

Como recursos se cuenta con el repositorio del proyecto ya existente (github.com/DeboradorDeMundos/dpay\_3.0), la infraestructura de D-PAY en producción, y el acompañamiento de la empresa Dtemite. Como facilitadores se identifica la experiencia previa del equipo con Git y la existencia de documentación heredada (colecciones Postman, plan de payment hub). Como posibles obstaculizadores se identifica la pendiente confirmación de roles Scrum con Dtemite y la necesidad de coordinar tiempos entre los tres integrantes del equipo.

# **Propuesta de Evidencias**

Las siguientes evidencias permitirán dar cuenta del logro de las actividades del Proyecto APT:

* Historial de commits y Pull Requests en el repositorio GitHub del equipo, que evidencian el avance incremental del desarrollo.
* Documento de Product Vision (v0.2) y Product Backlog priorizado (HU-01 a HU-08), como evidencia de la planificación inicial.
* Estructura de carpetas de documentación del repositorio (fase1/grupales, fase1/individuales, fase2, fase3), que organiza la evidencia por fase del curso.
* Documentos individuales de autoevaluación de competencias y diario de reflexión, que evidencian el proceso formativo personal.
* Registro de pruebas funcionales de la integración con Webpay una vez implementada, como evidencia del cumplimiento del MVP.

# **Conclusions**

Phase 1 of the D-PAY 3.0 project allowed me to translate a real, in-production system into a clearly scoped academic project without losing sight of academic honesty about what already existed versus what the team is actually building. Framing the contribution as an extensible multi-gateway payment architecture, rather than a single Webpay integration, gave the project both technical depth and a realistic scope for a semester. Defining the Product Vision and a prioritized backlog under Scrum also reinforced the importance of incremental delivery: starting with one gateway as an MVP reduces risk while still leaving a documented path for future integrations. Overall, this phase confirmed that the project is feasible within the course timeframe, provided the team keeps working closely with Dtemite to confirm the remaining Scrum roles.

# **Reflection**

Joining this project meant leaving behind an initial idea centered on AI and cloud computing, which was closer to my own professional interests, and adapting to an existing team project instead. At first this felt like a step away from what I wanted to specialize in, but working on D-PAY's architecture helped me see the connection: designing a decoupled, extensible payment layer requires the same architectural thinking I would use in a cloud-native system, just applied to a different domain. I also made a deliberate choice to keep my interest in AI present in how I work, not in what the product does — I used an AI assistant as a technical guide to structure and generate my Capstone documentation through a reproducible pipeline, which gave me hands-on practice with AI-assisted workflows, one of the areas I want to keep developing professionally. Looking ahead to Phase 2, I want to stay actively involved in the architecture decisions for the payment gateway integration, and make sure the Scrum roles get confirmed early with Dtemite so the team is not blocked once development picks up pace.