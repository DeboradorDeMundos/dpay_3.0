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

Diego Madrid · PTY4614 Capstone, Sección 001 · Proyecto D-PAY 3.0

# **Abstract (Español)**

El presente proyecto de título, denominado D-PAY 3.0, se desarrolla en conjunto con la empresa Dtemite y consiste en la evolución del sistema de punto de venta móvil D-PAY, actualmente en producción, desde una arquitectura de pagos dependiente de hardware de terminal (TUU/Kozen) hacia un modelo de pasarelas de pago extensible y desacoplado. Mi aporte individual se concentra en la integración entre la aplicación móvil, los servicios de backend y los proveedores de pago, asegurando que los flujos de cobro, sincronización y emisión de documentos funcionen de forma confiable. El aporte técnico central del equipo es el diseño e implementación de una arquitectura multi-gateway que permite incorporar nuevos medios de pago sin reescribir la lógica de negocio existente, utilizando Webpay como implementación mínima viable (MVP) y dejando documentadas en el backlog las integraciones futuras con Flow, MercadoLibre y PayPal. El proyecto se gestiona bajo la metodología Agile Scrum, con un equipo de tres integrantes, y se desarrolla en tres fases a lo largo del semestre. Este documento constituye la autoevaluación individual correspondiente a la Fase 1, en la que se define el proyecto, se justifica su factibilidad y se establece la planificación de trabajo.

# **Abstract (English)**

This capstone project, D-PAY 3.0, is developed with the company Dtemite and evolves the mobile point-of-sale system D-PAY, already in production, from a hardware-dependent card-payment architecture (Kozen/TUU) into an extensible, decoupled multi-gateway model. My individual contribution focuses on integrating the mobile application with backend services and external payment providers, ensuring that sales, payment and document flows remain reliable across devices. The team's core technical contribution is the design and implementation of a PaymentGateway module that allows new payment providers to be added without rewriting the existing sales logic, using Transbank Webpay in a sandbox environment as the minimum viable product (MVP) and documenting future integrations with Flow, MercadoLibre and PayPal in the product backlog. The project is managed under the Agile Scrum methodology, with a three-member team, and is organized in three phases throughout the semester. This document is the individual Phase 1 self-assessment: it defines the project, links it to the graduate profile and to my professional interests, argues its feasibility, and sets out the work plan and the evidence of achievement.

# **Descripción del Proyecto APT**

# D-PAY 3.0 es un proyecto de título orientado a evolucionar D-PAY, un sistema de punto de venta (POS) móvil desarrollado en React Native, ya utilizado en producción por Dtemite, cuyo contacto principal es José Robles Rocha. El sistema emite Documentos Tributarios Electrónicos (DTE) conforme a la normativa del Servicio de Impuestos Internos y gestiona ventas en modalidad online y offline. En su estado actual, el cobro con tarjeta de crédito o débito solo funciona en terminales dedicados Kozen (modelo P8 Neo), a través de la aplicación TUU Negocio (Haulmer), integrada mediante un Intent nativo de Android exclusivo de ese hardware (Dtemite, 2026).

# Esta dependencia genera una limitación laboral y comercial concreta para la Ingeniería en Informática: D-PAY no puede operar como solución de cobro con tarjeta en un smartphone Android o iOS genérico. Eso restringe la adopción del producto a comercios que ya invirtieron en hardware Kozen y deja fuera a quienes solo disponen de un celular convencional. El impacto en el campo laboral es doble. Para la empresa mandante, desbloquear el cobro en dispositivos genéricos amplía el mercado sin exigir una inversión adicional en terminales. Para el perfil profesional de un ingeniero informático, el problema exige integración de APIs, diseño de arquitectura, consumo de servicios externos, sincronización de datos y gestión ágil de un producto real, competencias habituales en equipos de software de pagos, retail y fintech.

# El proyecto busca resolver esa limitación diseñando una capa de pagos extensible. El módulo PaymentGateway detectará el tipo de dispositivo (terminal Kozen versus smartphone genérico) y seleccionará el proveedor correspondiente, aplicando un contrato común de tipo adaptador/strategy (Gamma et al., 1995). Como MVP del semestre se integra Transbank Webpay en ambiente de pruebas (Transbank, s. f.). Las integraciones con Flow, MercadoLibre y PayPal quedan documentadas y priorizadas en el Product Backlog para etapas posteriores. El equipo de desarrollo está compuesto por Diego Madrid, Pablo Gutiérrez y Reinhard Munzenmayer, y mi rol principal dentro del equipo es el desarrollo e integración de los flujos móviles con backend y pasarelas de pago.

# **Relación del Proyecto APT con las Competencias del Perfil de Egreso**

El proyecto D-PAY 3.0 se relaciona de forma coherente con cuatro competencias del perfil de egreso de Ingeniería en Informática de Duoc UC (Duoc UC, s. f.). A continuación indico cómo debo utilizar cada una para desarrollar el Proyecto APT:

Gestionar proyectos informáticos, ofreciendo alternativas para la toma de decisiones de acuerdo con los requerimientos de la organización. Debo participar en la planificación y control bajo Scrum: Product Vision, Product Backlog priorizado (HU-01 a HU-08), sprints y ceremonias. Con ello el equipo entrega a Dtemite alternativas concretas —mantener TUU en Kozen, habilitar Webpay en celular genérico, o postergar otras pasarelas— para decidir según su prioridad comercial (Schwaber y Sutherland, 2020).

Desarrollar una solución de software utilizando técnicas que permitan sistematizar el proceso de desarrollo y mantenimiento, asegurando el logro de los objetivos. Debo construir e integrar el módulo PaymentGateway y la pasarela Webpay dentro de la aplicación existente, conectando pantallas de venta, servicios de API y flujos de retorno de pago, sin reescribir la lógica central del POS. El trabajo se sistematiza con Git/GitHub, ramas de feature y Pull Requests, de modo que el mantenimiento futuro de un nuevo proveedor sea agregar una implementación del contrato, no modificar la lógica de negocio.

Construir modelos de datos para soportar los requerimientos de la organización de acuerdo a un diseño definido y escalable en el tiempo. Debo asegurar que el resultado de un pago web (aprobado, rechazado, error de conexión) se persista y sincronice de forma coherente con el modelo actual de transacciones de D-PAY, de manera que mañana se puedan añadir Flow o PayPal sin romper reportes, conciliación ni trazabilidad. Aunque no es mi competencia más fuerte, es clave para que la integración móvil no quede desconectada del resto del sistema.

Realizar pruebas de certificación tanto de los productos como de los procesos utilizando buenas prácticas definidas por la industria. Debo diseñar y ejecutar pruebas funcionales del flujo Webpay (HU-06): pago aprobado, rechazado y error de conexión, con evidencia (casos de prueba, logs o capturas) y registro de defectos. Esta competencia es una de mis principales oportunidades de mejora: hoy realizo validaciones manuales en dispositivo, pero necesito fortalecer pruebas más estructuradas y repetibles.

# **Relación del Proyecto con mis Intereses Profesionales**

# Mis intereses profesionales están orientados al desarrollo e integración de soluciones de software que conecten aplicaciones móviles, servicios en la nube y sistemas de pago, con foco en productos útiles para comercios y empresas. Me interesa especialmente el área de integración de sistemas y desarrollo mobile en contextos POS, pagos electrónicos y automatización de procesos comerciales.

# En la autoevaluación de competencias (entrega 1.1) marqué Alto Dominio en programación de software, análisis y planificación de requerimientos, arquitectura de software y gestión de proyectos informáticos. También identifiqué como áreas a fortalecer la calidad de software y, en menor medida, el dominio formal de modelos de datos e inglés intermedio alto. Mi experiencia reciente en D-PAY me ha permitido trabajar con React Native, TypeScript, consumo de APIs REST, sincronización de datos y flujos de pago con TUU, lo que refuerza mi perfil de integración.

# D-PAY 3.0 refleja esos intereses de tres maneras. Primero, aborda un problema real de integración: conectar una app móvil en producción con nuevos proveedores de pago y con el backend de Dtemite, sin depender exclusivamente del hardware Kozen. Segundo, me exige profundizar en arquitectura de software aplicada: contratos de pago, selección de gateway, manejo de estados y errores de red en un flujo comercial crítico. Tercero, me obliga a fortalecer calidad de software mediante pruebas funcionales del MVP Webpay, una competencia que sé que debo desarrollar con mayor rigor. En cinco años quiero liderar proyectos de integración y productos digitales; trabajar sobre un POS real, con empresa mandante y flujos de pago en producción, me acerca más a ese objetivo que un prototipo académico aislado.

# **Argumento de Factibilidad del Proyecto**

El proyecto es factible de realizarse en el marco de la asignatura por las siguientes razones:

* No se construye un sistema desde cero. D-PAY ya está en producción, con stack definido (React Native 0.75.5, TypeScript, Zustand + MMKV, React Navigation) y un repositorio existente, lo que reduce el tiempo de levantamiento de contexto y el riesgo técnico.
* El alcance del semestre está acotado a un MVP verificable: detección de dispositivo, contrato PaymentGateway e integración Webpay en sandbox. Flow, MercadoLibre y PayPal quedan fuera del MVP y documentados en el backlog (HU-07 y HU-08). No se incluye paso a producción con credenciales reales, ni Docker, ni rediseño del módulo DTE. Esa delimitación cabe en el calendario del curso.
* El equipo cuenta con tres integrantes, flujo Git definido (ramas de feature, Pull Requests, sin intervención directa de main) y una empresa mandante con contacto validado (José Robles Rocha), lo que asegura retroalimentación de negocio.
* Los materiales necesarios están disponibles: repositorio público, documentación heredada (colecciones Postman, análisis del modelo de pagos TUU, plan de payment hub), documentación oficial de Webpay y el acompañamiento del docente guía.

Como dificultades previsibles y su forma de abordarlas:

* La confirmación de Product Owner y Scrum Master por parte de Dtemite sigue pendiente. Se aborda dando seguimiento activo en las primeras semanas y, mientras tanto, el equipo prioriza el backlog de forma preliminar, dejando explícito que es un borrador sujeto a validación.
* La coordinación de horarios entre tres integrantes que trabajan se aborda con ceremonias Scrum cortas, tablero compartido y PRs asíncronos.
* La curva de aprendizaje de Webpay y del código React Native existente se aborda con un spike técnico temprano en Fase 2 (HU-01 y HU-02 primero, porque son prerrequisito de HU-03) y con el apoyo de la documentación oficial de Transbank.
* En mi caso personal, la integración con servicios externos exige comprender bien los contratos de API, los estados de transacción y los escenarios de error; por eso documentaré cada flujo y validaré los casos críticos antes de avanzar a la UI final.

Si alguna de estas dificultades se agrava (por ejemplo, demora prolongada de Dtemite o bloqueo de sandbox), el plan de contingencia es mantener el valor de negocio mínimo: dejar implementado y documentado el contrato PaymentGateway y un flujo Webpay demostrable en pruebas, aunque la UI de selección (HU-04) se simplifique.

# **Objetivos**

## **Objetivo General**

Diseñar e implementar una arquitectura de pagos extensible para el sistema D-PAY, que permita incorporar múltiples pasarelas de pago digitales de forma desacoplada, utilizando Webpay como implementación mínima viable durante el semestre.

## **Objetivos Específicos**

Levantar y documentar la arquitectura de pagos actual de D-PAY, identificando la dependencia del Intent TUU y del hardware Kozen P8 Neo.

Diseñar un mecanismo de detección de dispositivo (terminal POS Kozen versus smartphone genérico) para seleccionar automáticamente el proveedor de pago.

Definir el contrato de abstracción PaymentGateway (adaptador/strategy) de modo que un nuevo proveedor se agregue sin modificar la lógica de venta existente.

Integrar Transbank Webpay como primera pasarela web, en ambiente de pruebas, cubriendo inicio de transacción, confirmación y retorno del resultado a la venta.

Diseñar la interfaz de selección de pasarela dentro del flujo de cobro existente, respetando el estilo visual de D-PAY.

Documentar en el Product Backlog las integraciones futuras con Flow, MercadoLibre y PayPal como trabajo fuera del MVP.

Gestionar el desarrollo aplicando Agile Scrum, con backlog priorizado, sprints y ceremonias, y diseñar las pruebas funcionales que certifiquen el flujo de pago.

# **Propuesta Metodológica de Trabajo**

El proyecto se gestiona mediante la metodología Agile Scrum, adecuada dado el tamaño reducido del equipo (tres integrantes), la necesidad de iterar rápidamente sobre un sistema ya existente, y la posibilidad de recibir retroalimentación frecuente de la empresa mandante. El trabajo se organiza en un Product Backlog priorizado (Historias de Usuario HU-01 a HU-08), del cual se desprenden los sprints planificados para cada fase del curso. Se contemplan las ceremonias propias de Scrum —Sprint Planning, Daily Scrum, Sprint Review y Sprint Retrospective— y se definirán junto a Dtemite los roles de Product Owner y Scrum Master, mientras que el Development Team está conformado por los tres integrantes del equipo.

El control de versiones se realiza mediante Git y GitHub, con un flujo de trabajo basado en ramas de feature y Pull Requests revisados antes de integrarse a la rama principal, lo que asegura la trazabilidad de los cambios y evita afectar directamente el código en producción.

# **Plan de Trabajo para el Proyecto APT**

El plan de trabajo se organiza en tres fases a lo largo del semestre, alineadas con la estructura del curso Capstone:

* Fase 1: definición del proyecto, Product Vision, Product Backlog priorizado y documentación individual (autoevaluación de competencias, diario de reflexión y esta autoevaluación de Fase 1).
* Fase 2: desarrollo e implementación de la integración con Webpay, avance de los sprints definidos y actualización de la documentación técnica del repositorio.
* Fase 3: cierre del proyecto, pruebas finales, documentación de resultados y entrega final.

Como recursos se cuenta con el repositorio del proyecto ya existente (github.com/DeboradorDeMundos/dpay\_3.0), la infraestructura de D-PAY en producción, y el acompañamiento de la empresa Dtemite. Como facilitadores se identifica la experiencia previa del equipo con Git, mi trabajo previo en integración móvil/API y la existencia de documentación heredada (colecciones Postman, plan de payment hub). Como posibles obstaculizadores se identifica la pendiente confirmación de roles Scrum con Dtemite y la necesidad de coordinar tiempos entre los tres integrantes del equipo.

# **Propuesta de Evidencias**

Las siguientes evidencias permiten dar cuenta del logro de las actividades y se seleccionan porque son verificables, trazables y alineadas con cada objetivo:

* Product Vision (v0.1 o superior) y Product Backlog (HU-01 a HU-08). Demuestran que el problema, el alcance del MVP y la priorización quedaron definidos en Fase 1, y justifican las decisiones de dejar Flow, MercadoLibre y PayPal fuera del semestre.
* Historial de commits y Pull Requests en GitHub. Evidencian el avance incremental, la revisión entre pares y que no se interviene main de forma directa. Dan cuenta de las actividades de construcción e integración (objetivos de software).
* Estructura de carpetas del repositorio (fase1/grupales, fase1/individuales, fase2, fase3). Organiza la evidencia por fase y facilita la evaluación docente.
* Documentos individuales de Fase 1 (autoevaluación de competencias 1.1, diario de reflexión 1.2 y este informe 1.3). Evidencian el proceso formativo y la coherencia entre intereses profesionales y definición del APT.
* Diseño técnico de Fase 2 (arquitectura actualizada, UML de caso de uso, secuencia Webpay y componentes, requisitos no funcionales). Justifica el cumplimiento del objetivo de documentar el diseño y de explicitar el patrón del PaymentGateway.
* Registro de pruebas funcionales de Webpay (casos aprobado / rechazado / error de conexión, logs o capturas, defectos y correcciones). Es la evidencia que certifica el MVP y la competencia de calidad de software.

No se proponen evidencias que no se puedan producir en el plazo (por ejemplo, pasarela en producción o integraciones HU-07/HU-08).

# **Conclusions**

# Phase 1 allowed me to translate a real, in-production POS into a clearly scoped capstone project without losing sight of what already existed versus what the team is actually building. For my role, the key outcome is that integration work —mobile app, backend services and external payment providers— is now framed as a deliberate architectural contribution, not as ad hoc fixes on top of TUU. The extensible payment architecture, with device detection, a PaymentGateway contract and a Webpay sandbox MVP, is feasible in one semester because later gateways remain in the backlog. Defining the Product Vision and a prioritized backlog under Scrum also reinforced why incremental delivery matters: one working web gateway reduces risk for Dtemite while leaving a documented path for Flow, MercadoLibre and PayPal. The remaining dependency is organizational rather than technical: Product Owner and Scrum Master roles must be confirmed early so Phase 2 does not start with an unvalidated backlog.

# **Reflection**

Before joining D-PAY 3.0, I saw the APT mainly as an opportunity to strengthen mobile development and system integration —connecting apps, APIs and payment flows in a product with real users. Working on an existing POS instead of a greenfield prototype felt challenging at first, because it meant adapting to code, conventions and business rules that were already in place. After Phase 1, I see that as an advantage. Dtemite offers a genuine integration problem: the app must keep supporting TUU on Kozen terminals while opening a path to Webpay on generic smartphones, without breaking sales, DTE issuance or synchronization with the backend. That is exactly the kind of work I want to specialize in. My strongest contribution so far has been understanding and connecting existing flows —payment intents, API consumption, sync states and error handling— rather than designing everything from scratch. My main growth area is software quality: I rely heavily on manual testing on device, and Phase 2 is where I need to turn that into structured test cases and repeatable evidence for the Webpay flow. Looking ahead, I want to take ownership of the integration stories (HU-01 to HU-03 and HU-06), support the gateway selection UI where needed, and help the team deliver a demonstrable MVP that Dtemite can evaluate with confidence.

I also need to treat English as a professional skill, not only as a course requirement. Writing the abstract, conclusions and this reflection at an upper-intermediate level is part of that practice; listening and speaking remain my weakest points and I will keep working on them during the semester. Looking ahead to Phase 2, I want to take an active role in the data contract of PaymentGateway and in the first implementation stories (HU-01 and HU-02), so that when *Webpay* is integrated I am not only supporting from the database side. That combination —stronger programming on a real product, plus the data discipline I already have— is the most direct path I can see toward the five-year goal of shipping my own software or leading an automation area.