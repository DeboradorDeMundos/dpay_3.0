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

*Pablo Gutierrez · PTY4614 Capstone, Sección 001 · Proyecto D-PAY 3.0*

# **Abstract (Español)**

El presente proyecto de título, denominado D-PAY 3.0, se desarrolla en conjunto con la empresa Dtemite y consiste en la evolución del sistema de punto de venta móvil D-PAY, actualmente en producción, desde una arquitectura de pagos dependiente de hardware de terminal (TUU/Kozen) hacia un modelo de pasarelas de pago extensible y desacoplado. El aporte técnico central es el diseño e implementación de una arquitectura multi-gateway que permite incorporar nuevos medios de pago sin reescribir la lógica de negocio existente, utilizando Webpay como implementación mínima viable (MVP) y dejando documentadas en el backlog las integraciones futuras con Flow, MercadoLibre y PayPal. El proyecto se gestiona bajo la metodología Agile Scrum, con un equipo de tres integrantes, y se desarrolla en tres fases a lo largo del semestre. Este documento constituye la autoevaluación individual correspondiente a la Fase 1, en la que se define el proyecto, se justifica su factibilidad y se establece la planificación de trabajo.

# **Abstract (English)**

This capstone project, D-PAY 3.0, is developed with the company Dtemite and evolves the mobile point-of-sale system D-PAY, already in production, from a hardware-dependent card-payment architecture (Kozen/TUU) into an extensible, decoupled multi-gateway model. The team’s core technical contribution is the design and implementation of a PaymentGateway module that allows new payment providers to be added without rewriting the existing sales logic, using Transbank Webpay in a sandbox environment as the minimum viable product (MVP) and documenting future integrations with Flow, MercadoLibre and PayPal in the product backlog. The project is managed under the Agile Scrum methodology, with a three-member team, and is organized in three phases throughout the semester. This document is the individual Phase 1 self-assessment: it defines the project, links it to the graduate profile and to my professional interests, argues its feasibility, and sets out the work plan and the evidence of achievement.

# **Descripción del Proyecto APT**

# D-PAY 3.0 es un proyecto de título orientado a evolucionar D-PAY, un sistema de punto de venta (POS) móvil desarrollado en React Native, ya utilizado en producción por Dtemite, cuyo contacto principal es José Robles Rocha. El sistema emite Documentos Tributarios Electrónicos (DTE) conforme a la normativa del Servicio de Impuestos Internos y gestiona ventas en modalidad online y offline. En su estado actual, el cobro con tarjeta de crédito o débito solo funciona en terminales dedicados Kozen (modelo P8 Neo), a través de la aplicación TUU Negocio (Haulmer), integrada mediante un Intent nativo de Android exclusivo de ese hardware (Dtemite, 2026).

# Esta dependencia genera una limitación laboral y comercial concreta para la Ingeniería en Informática: D-PAY no puede operar como solución de cobro con tarjeta en un smartphone Android o iOS genérico. Eso restringe la adopción del producto a comercios que ya invirtieron en hardware Kozen y deja fuera a quienes solo disponen de un celular convencional. El impacto en el campo laboral es doble. Para la empresa mandante, desbloquear el cobro en dispositivos genéricos amplía el mercado sin exigir una inversión adicional en terminales. Para el perfil profesional de un ingeniero informático, el problema exige diseño de arquitectura, integración con servicios de terceros, modelamiento de datos de transacción y gestión ágil de un producto real, competencias habituales en equipos de software de pagos, retail y fintech.

# El proyecto busca resolver esa limitación diseñando una capa de pagos extensible. El módulo PaymentGateway detectará el tipo de dispositivo (terminal Kozen versus smartphone genérico) y seleccionará el proveedor correspondiente, aplicando un contrato común de tipo adaptador/strategy (Gamma et al., 1995). Como MVP del semestre se integra Transbank Webpay en ambiente de pruebas (Transbank, s. f.). Las integraciones con Flow, MercadoLibre y PayPal quedan documentadas y priorizadas en el Product Backlog para etapas posteriores. El equipo de desarrollo está compuesto por Diego Madrid, Pablo Gutiérrez y Reinhard Munzenmayer.

# **Relación del Proyecto APT con las Competencias del Perfil de Egreso**

El proyecto D-PAY 3.0 se relaciona de forma coherente con cuatro competencias del perfil de egreso de Ingeniería en Informática de Duoc UC (Duoc UC, s. f.). A continuación indico cómo debo utilizar cada una para desarrollar el Proyecto APT:

Gestionar proyectos informáticos, ofreciendo alternativas para la toma de decisiones de acuerdo con los requerimientos de la organización. Debo aplicar planificación y control bajo Scrum: Product Vision, Product Backlog priorizado (HU-01 a HU-08), sprints y ceremonias. Con ello el equipo entrega a Dtemite alternativas concretas —mantener TUU en Kozen, habilitar Webpay en celular genérico, o postergar otras pasarelas— para decidir según su prioridad comercial (Schwaber y Sutherland, 2020).

Desarrollar una solución de software utilizando técnicas que permitan sistematizar el proceso de desarrollo y mantenimiento, asegurando el logro de los objetivos. Debo construir e integrar el módulo PaymentGateway y la pasarela Webpay dentro de la aplicación existente, sin reescribir SalePaymentScreen ni el flujo de venta. El trabajo se sistematiza con Git/GitHub, ramas de feature y Pull Requests, de modo que el mantenimiento futuro de un nuevo proveedor sea agregar una implementación del contrato, no modificar la lógica de negocio.

Construir modelos de datos para soportar los requerimientos de la organización de acuerdo a un diseño definido y escalable en el tiempo. Debo diseñar cómo se persistirá el resultado de un pago web (aprobado, rechazado, error de conexión) de forma coherente con el modelo actual de transacciones de D-PAY, de manera que mañana se puedan añadir Flow o PayPal sin romper reportes, conciliación ni trazabilidad. Esta competencia es mi principal fortaleza profesional y la aplicaré al contrato de datos del PaymentGateway y a los ajustes estrictamente necesarios sobre el registro de pagos.

Realizar pruebas de certificación tanto de los productos como de los procesos utilizando buenas prácticas definidas por la industria. Debo diseñar y ejecutar pruebas funcionales del flujo Webpay (HU-06): pago aprobado, rechazado y error de conexión, con evidencia (casos de prueba, logs o capturas) y registro de defectos. En Fase 1 esta competencia se evidencia en la planificación; su aplicación completa corresponde a la Fase 2.

# **Relación del Proyecto con mis Intereses Profesionales**

# Mis intereses profesionales están centrados en el análisis y desarrollo de modelos de datos relacionales y, a mediano plazo, en desarrollar y comercializar software propio de manera independiente, o bien liderar un área de automatización. Llevo cuatro años en el rubro resolviendo problemas a nivel de bases de datos, generando reportes y automatizando procesos. Actualmente trabajo en una empresa emergente de ERP como soporte avanzado: cubro desde la atención al cliente hasta la identificación de errores web, creé un módulo de soporte técnico con videotutoriales y ticketera, y automatizo procesos del sistema para reducir la carga operativa.

# Esas mismas competencias —entender el negocio, modelar información y construir herramientas que bajen fricción operativa— son las que quiero llevar al siguiente nivel. En la autoevaluación de competencias (entrega 1.1) marqué Excelente Dominio en modelos de datos, requerimientos, gestión de proyectos, inteligencia de negocios y calidad de software, y Alto Dominio en arquitectura y programación de software. El aspecto que debo fortalecer con más urgencia es la programación de software a nivel general, porque mi día a día laboral está casi al 100 % enfocado en bases de datos.

# D-PAY 3.0 refleja esos intereses de tres maneras. Primero, se sitúa en una empresa emergente con un cuello de botella real: el cobro con tarjeta no escala más allá del hardware Kozen. Ese es el tipo de contexto que yo mismo planteé como escenario ideal para el APT. Segundo, el proyecto me obliga a salir de la zona de confort del dato puro e involucrarme en código de una aplicación React Native/TypeScript en producción: integraciones, UI de selección de pasarela y un módulo de arquitectura. Tercero, no abandono mi fuerte: el modelo de datos de pagos, la trazabilidad de la transacción y la consistencia con lo ya persistido siguen siendo parte central del diseño. En cinco años quiero estar desarrollando software propio o liderando automatización; trabajar sobre un POS real, con empresa mandante y disciplina de Git, me acerca más a ese escenario que un prototipo académico desconectado del mercado.

# **Argumento de Factibilidad del Proyecto**

El proyecto es factible de realizarse en el marco de la asignatura por las siguientes razones:

* No se construye un sistema desde cero. D-PAY ya está en producción, con stack definido (*React Native* 0.75.5, *TypeScript*, *Zustand* + *MMKV*, *React Navigation*) y un repositorio existente, lo que reduce el tiempo de levantamiento de contexto y el riesgo técnico.
* El alcance del semestre está acotado a un MVP verificable: detección de dispositivo, contrato PaymentGateway e integración *Webpay* en sandbox. *Flow*, *MercadoLibre* y *PayPal* quedan fuera del MVP y documentados en el backlog (HU-07 y HU-08). No se incluye paso a producción con credenciales reales, ni Docker, ni rediseño del módulo DTE. Esa delimitación cabe en las 18 semanas del Capstone (Fase 1: semanas 1-4; Fase 2: semanas 5-15; Fase 3: semanas 16-18).
* El equipo tiene tres integrantes, flujo Git ya definido (ramas de feature, Pull Requests, sin intervención directa de main) y una empresa mandante con contacto validado (José Robles Rocha), lo que asegura retroalimentación de negocio.
* Los materiales necesarios están disponibles: repositorio público, documentación heredada (colecciones Postman, análisis del modelo de pagos *TUU*), documentación oficial de *Webpay* y el acompañamiento del docente guía.

Como dificultades previsibles y su forma de abordarlas:

* La confirmación de Product Owner y Scrum Master por parte de Dtemite sigue pendiente. Se aborda dando seguimiento activo en las primeras semanas y, mientras tanto, el equipo prioriza el backlog de forma preliminar, dejando explícito que es un borrador sujeto a validación.
* La coordinación de horarios entre tres integrantes que trabajan se aborda con ceremonias Scrum cortas, tablero compartido y PRs asíncronos.
* La curva de aprendizaje de *Webpay* y del código *React Native* existente se aborda con un spike técnico temprano en Fase 2 (HU-01 y HU-02 primero, porque son prerrequisito de HU-03) y con el apoyo de la documentación oficial de Transbank.
* En mi caso personal, el inglés escrito de los apartados exigidos lo refuerzo con revisión y práctica; el speaking/listening queda como mejora continua y no bloquea el MVP.

Si alguna de estas dificultades se agrava (por ejemplo, demora prolongada de Dtemite o bloqueo de sandbox), el plan de contingencia es mantener el valor de negocio mínimo: dejar implementado y documentado el contrato PaymentGateway y un flujo *Webpay* demostrable en pruebas, aunque la UI de selección (HU-04) se simplifique.

# **Objetivos**

## **Objetivo General**

Diseñar e implementar una arquitectura de pagos extensible para el sistema D-PAY, que permita incorporar múltiples pasarelas de pago digitales de forma desacoplada, utilizando Webpay como implementación mínima viable durante el semestre.

## **Objetivos Específicos**

 Levantar y documentar la arquitectura de pagos actual de D-PAY, identificando la dependencia del Intent *TUU* y del hardware *Kozen* P8 Neo.

 Diseñar un mecanismo de detección de dispositivo (terminal POS *Kozen* versus smartphone genérico) para seleccionar automáticamente el proveedor de pago.

 Definir el contrato de abstracción PaymentGateway (adaptador/strategy) de modo que un nuevo proveedor se agregue sin modificar la lógica de venta existente.

 Integrar Transbank *Webpay* como primera pasarela web, en ambiente de pruebas, cubriendo inicio de transacción, confirmación y retorno del resultado a la venta.

 Diseñar la interfaz de selección de pasarela dentro del flujo de cobro existente, respetando el estilo visual de D-PAY.

 Documentar en el Product Backlog las integraciones futuras con *Flow*, *MercadoLibre* y *PayPal* como trabajo fuera del MVP.

 Gestionar el desarrollo aplicando Agile Scrum, con backlog priorizado, sprints y ceremonias, y diseñar las pruebas funcionales que certifiquen el flujo de pago.

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

Las siguientes evidencias permiten dar cuenta del logro de las actividades y se seleccionan porque son verificables, trazables y alineadas con cada objetivo:

* **Product Vision (v0.1 o superior) y Product Backlog (HU-01 a HU-08).** Demuestran que el problema, el alcance del MVP y la priorización quedaron definidos en Fase 1, y justifican las decisiones de dejar *Flow*, *MercadoLibre* y *PayPal* fuera del semestre.
* **Historial de commits y Pull Requests** en GitHub. Evidencian el avance incremental, la revisión entre pares y que no se interviene main de forma directa. Dan cuenta de las actividades de construcción e integración (objetivos de software).
* **Estructura de carpetas del repositorio** (fase1/grupales, fase1/individuales, fase2, fase3). Organiza la evidencia por fase y facilita la evaluación docente.
* **Documentos individuales de Fase 1** (autoevaluación de competencias 1.1, diario de reflexión 1.2 y este informe 1.3). Evidencian el proceso formativo y la coherencia entre intereses profesionales y definición del APT.
* **Diseño técnico de Fase 2** (arquitectura actualizada, UML de caso de uso, secuencia *Webpay* y componentes, requisitos no funcionales). Justifica el cumplimiento del objetivo de documentar el diseño y de explicitar el patrón del PaymentGateway.
* **Registro de pruebas funcionales de Webpay** (casos aprobado / rechazado / error de conexión, logs o capturas, defectos y correcciones). Es la evidencia que certifica el MVP y la competencia de calidad de software.

No se proponen evidencias que no se puedan producir en el plazo (por ejemplo, pasarela en producción o integraciones HU-07/HU-08).

# **Conclusions**

# Phase 1 allowed me to turn a real, in-production POS into a clearly scoped capstone project, without presenting existing TUU/Kozen functionality as if the team had built it from scratch. The academic contribution is the extensible payment architecture —device detection, a PaymentGateway contract, and a Webpay sandbox MVP— not a full rewrite of D-PAY. That framing is honest, technically demanding, and feasible in 18 weeks because later gateways remain in the backlog. Defining the Product Vision and a prioritized backlog under Scrum also showed why incremental delivery matters: one working web gateway reduces risk for Dtemite and still leaves a documented path for Flow, MercadoLibre and PayPal. The remaining dependency is organizational rather than technical: Product Owner and Scrum Master roles must be confirmed early so Phase 2 does not start with an unvalidated backlog. Overall, the project is feasible within the course if the team protects the MVP scope and keeps a close feedback loop with Dtemite.

# **Reflection**

My earlier idea of the APT was closer to building a platform from scratch —an e-commerce or a back-office automation tool— because I wanted to move beyond a workday that is almost entirely databases and get more practice in general software programming. Joining D-PAY 3.0 meant adapting to an existing product and to a three-person team, instead of designing a greenfield system around my own interests. At first that felt like a compromise. After Phase 1 I see the fit more clearly. Dtemite is an emerging company with a concrete operational bottleneck, which is the context I had already described as the right place for this capstone. The work still forces me out of my comfort zone: I will have to read and change *React Native*/*TypeScript* code, integrate a third-party payment API, and participate in architecture decisions, not only in data models. At the same time, I can contribute from my strongest competence —relational data and transaction traceability— so the payment result is stored in a way that remains scalable when new gateways are added.

I also need to treat English as a professional skill, not only as a course requirement. Writing the abstract, conclusions and this reflection at an upper-intermediate level is part of that practice; listening and speaking remain my weakest points and I will keep working on them during the semester. Looking ahead to Phase 2, I want to take an active role in the data contract of PaymentGateway and in the first implementation stories (HU-01 and HU-02), so that when *Webpay* is integrated I am not only supporting from the database side. That combination —stronger programming on a real product, plus the data discipline I already have— is the most direct path I can see toward the five-year goal of shipping my own software or leading an automation area.