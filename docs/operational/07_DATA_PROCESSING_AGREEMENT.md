# Àpínlẹ̀rọ - Data Processing Agreement (DPA)

**Version:** 1.0
**Last Updated:** December 2024
**Purpose:** GDPR-compliant agreement for processing personal data on behalf of customers

---

## DATA PROCESSING AGREEMENT

This Data Processing Agreement ("DPA") forms part of the Terms of Service ("Agreement") between:

**Customer** (the "Controller"): The entity that has agreed to the Terms of Service

**Àpínlẹ̀rọ Limited** (the "Processor"): A company registered in England and Wales (Company Number: [INSERT]), with registered office at [INSERT ADDRESS]

---

## 1. Definitions

| Term | Definition |
|------|------------|
| **Data Protection Laws** | UK GDPR, Data Protection Act 2018, and PECR |
| **Personal Data** | Any information relating to an identified or identifiable natural person |
| **Processing** | Any operation performed on Personal Data |
| **Data Subject** | An identified or identifiable natural person |
| **Sub-processor** | Any third party engaged by the Processor to process Personal Data |
| **Supervisory Authority** | The Information Commissioner's Office (ICO) |
| **Controller** | The Customer who determines the purposes and means of processing |
| **Processor** | Àpínlẹ̀rọ Limited, processing data on behalf of the Controller |

---

## 2. Scope and Purpose

### 2.1 Subject Matter

This DPA applies to the processing of Personal Data by the Processor on behalf of the Controller in connection with the provision of the Àpínlẹ̀rọ platform services.

### 2.2 Nature and Purpose of Processing

| Aspect | Details |
|--------|---------|
| **Nature** | Collection, storage, organisation, retrieval, use, transmission |
| **Purpose** | Providing the Àpínlẹ̀rọ platform services as described in the Agreement |
| **Duration** | For the term of the Agreement plus 30 days for data deletion |

### 2.3 Types of Personal Data

| Category | Examples |
|----------|----------|
| **Customer's End-User Data** | Names, email addresses, phone numbers, addresses |
| **Order Data** | Purchase history, preferences, delivery information |
| **Communication Data** | WhatsApp messages, voice recordings (if using Voice AI) |
| **Payment Data** | Transaction references (card details processed by Stripe) |

### 2.4 Categories of Data Subjects

- Controller's customers
- Controller's employees/staff
- Controller's suppliers/contractors

---

## 3. Processor Obligations

### 3.1 Lawful Processing

The Processor shall:
- Process Personal Data only on documented instructions from the Controller
- Not process Personal Data for any purpose other than providing the Services
- Inform the Controller if an instruction infringes Data Protection Laws
- Process Personal Data in accordance with Data Protection Laws

### 3.2 Confidentiality

The Processor shall:
- Ensure all personnel processing Personal Data are bound by confidentiality obligations
- Ensure access is limited to those who need it for their job functions
- Not disclose Personal Data to third parties except as permitted by this DPA

### 3.3 Security Measures

The Processor shall implement appropriate technical and organisational measures:

#### Technical Measures

| Measure | Implementation |
|---------|----------------|
| **Encryption in Transit** | TLS 1.3 for all data transmission |
| **Encryption at Rest** | AES-256 for stored Personal Data |
| **Access Controls** | Role-based access control (RBAC) |
| **Authentication** | Multi-factor authentication available |
| **Network Security** | Firewalls, intrusion detection systems |
| **Backup** | Daily encrypted backups, geo-redundant |
| **Vulnerability Management** | Regular security scanning and patching |

#### Organisational Measures

| Measure | Implementation |
|---------|----------------|
| **Staff Training** | Annual data protection training |
| **Access Reviews** | Quarterly access rights review |
| **Security Policies** | Documented security procedures |
| **Incident Response** | Documented breach response procedure |
| **Vendor Assessment** | Due diligence on sub-processors |

### 3.4 Sub-processors

The Processor shall:
- Not engage a sub-processor without prior written authorisation from the Controller
- Ensure sub-processors are bound by equivalent data protection obligations
- Remain liable for sub-processor compliance

**Authorised Sub-processors:**

| Sub-processor | Service | Location | Data Processed |
|---------------|---------|----------|----------------|
| Supabase Inc. | Database hosting | EU (Frankfurt) | All platform data |
| Stripe Inc. | Payment processing | EU/US | Payment information |
| Vercel Inc. | Application hosting | Global CDN | Application logs |
| Meta Platforms (WhatsApp) | Messaging | EU/US | Customer messages |
| Vapi Inc. | Voice AI | US | Voice recordings |
| Neo4j Inc. | Graph database | EU | Operational data |

Controller consents to the engagement of the above sub-processors. Processor will notify Controller 30 days before adding new sub-processors.

### 3.5 Data Subject Rights

The Processor shall assist the Controller in responding to Data Subject requests:

| Right | Processor Obligation |
|-------|---------------------|
| **Access** | Provide data export functionality |
| **Rectification** | Enable Controller to correct data |
| **Erasure** | Delete data upon Controller request |
| **Restriction** | Implement processing restrictions |
| **Portability** | Provide data in machine-readable format |
| **Objection** | Facilitate objection handling |

**Response Time:** Processor shall respond to Controller requests within 10 business days.

### 3.6 Security Incidents

In the event of a Personal Data breach, the Processor shall:

| Action | Timeframe |
|--------|-----------|
| Notify Controller | Without undue delay, within 72 hours of awareness |
| Provide details | Nature, categories, approximate numbers, consequences, measures taken |
| Document breach | Maintain records of all breaches |
| Assist Controller | Help with regulatory notifications and communications |

**Breach Notification Content:**
- Description of the nature of the breach
- Categories and approximate number of Data Subjects concerned
- Categories and approximate number of Personal Data records concerned
- Name and contact details of the Processor's DPO or contact point
- Likely consequences of the breach
- Measures taken or proposed to address the breach

### 3.7 Data Protection Impact Assessment

Upon Controller request, Processor shall provide:
- Information about processing operations
- Assessment of risks to Data Subjects
- Technical and organisational measures in place
- Assistance with DPIA completion

### 3.8 Audit Rights

Controller has the right to:
- Request audit reports and certifications
- Conduct audits (with reasonable notice)
- Use third-party auditors (bound by confidentiality)

**Audit Procedure:**
1. Controller provides 30 days written notice
2. Parties agree scope, timing, and duration
3. Audit conducted during business hours
4. Controller bears audit costs
5. Findings shared with both parties

---

## 4. Controller Obligations

### 4.1 Lawful Basis

The Controller warrants that:
- A lawful basis exists for all Personal Data provided to the Processor
- Data Subjects have been informed of the processing
- Appropriate consent has been obtained where required
- Privacy notices accurately describe the processing

### 4.2 Instructions

The Controller shall:
- Provide clear, documented instructions for processing
- Ensure instructions comply with Data Protection Laws
- Notify Processor of any changes to processing requirements

### 4.3 Data Accuracy

The Controller is responsible for:
- Ensuring Personal Data is accurate and up-to-date
- Correcting inaccurate data promptly
- Notifying Processor of data that should be deleted

---

## 5. International Data Transfers

### 5.1 Transfer Mechanisms

For transfers outside the UK, the Processor relies on:

| Mechanism | Application |
|-----------|-------------|
| **UK Adequacy Decisions** | Transfers to EU/EEA |
| **UK IDTA** | Transfers to US and other countries |
| **Standard Contractual Clauses** | Supplementary protection |

### 5.2 US Transfers

For US-based sub-processors (Stripe, Vercel, Vapi):
- UK IDTA (International Data Transfer Agreement) in place
- Supplementary measures implemented
- Transfer Impact Assessments conducted
- Technical measures (encryption) applied

### 5.3 Supplementary Measures

| Measure | Purpose |
|---------|---------|
| Encryption in transit and at rest | Prevent unauthorised access |
| Pseudonymisation where possible | Reduce identifiability |
| Access controls | Limit who can access data |
| Contractual protections | Legal commitment from sub-processors |
| Data minimisation | Only transfer necessary data |

---

## 6. Data Retention and Deletion

### 6.1 Retention During Agreement

Personal Data is retained for the duration of the Agreement plus a 30-day grace period for data export.

### 6.2 Deletion Upon Termination

Upon termination of the Agreement:

| Timeline | Action |
|----------|--------|
| 0-30 days | Data accessible for export by Controller |
| 30-60 days | Data archived, available on request |
| After 60 days | Personal Data permanently deleted |

**Exceptions:**
- Data required for legal compliance may be retained longer
- Anonymised data may be retained indefinitely

### 6.3 Deletion Certificate

Upon request, Processor will provide written confirmation that all Personal Data has been deleted, except where retention is legally required.

---

## 7. Liability

### 7.1 Processor Liability

The Processor is liable for:
- Processing outside Controller's instructions
- Failure to implement appropriate security measures
- Engaging sub-processors without authorisation
- Failure to notify breaches as required

### 7.2 Liability Cap

Subject to the limitations in the Agreement:
- Processor's liability for DPA breaches follows the Agreement's liability provisions
- Both parties remain liable to Data Subjects under Data Protection Laws

### 7.3 Indemnification

Each party shall indemnify the other against claims arising from:
- That party's breach of this DPA
- That party's breach of Data Protection Laws
- That party's negligence or wilful misconduct

---

## 8. Term and Termination

### 8.1 Term

This DPA is effective from the Agreement effective date and continues until the Agreement terminates.

### 8.2 Survival

The following provisions survive termination:
- Section 3.6 (Security Incidents) - for incidents during the term
- Section 6 (Data Retention and Deletion)
- Section 7 (Liability)

---

## 9. General Provisions

### 9.1 Amendments

This DPA may be amended:
- By mutual written agreement
- By Processor with 30 days notice for changes required by law
- Controller may terminate if changes are unacceptable

### 9.2 Conflict

In case of conflict between this DPA and the Agreement:
- This DPA takes precedence for data protection matters
- The Agreement takes precedence for all other matters

### 9.3 Governing Law

This DPA is governed by the laws of England and Wales.

### 9.4 Supervisory Authority

The relevant supervisory authority is:

**Information Commissioner's Office (ICO)**
Wycliffe House, Water Lane
Wilmslow, Cheshire SK9 5AF
United Kingdom

Website: https://ico.org.uk
Phone: 0303 123 1113

---

## 10. Contact Information

### Processor Contact

**Data Protection Officer (or Contact)**
Àpínlẹ̀rọ Limited
Email: dpo@apinlero.com
Address: [INSERT ADDRESS]

### Controller Contact

The Controller shall provide their contact details upon signing the Agreement.

---

## Annex A: Processing Details

### A.1 Processing Operations

| Operation | Description |
|-----------|-------------|
| Collection | Receiving data from Controller's platform usage |
| Storage | Storing data in cloud databases |
| Organisation | Structuring data in the platform |
| Retrieval | Enabling Controller access to data |
| Use | Processing for service delivery |
| Transmission | Sending data via APIs, notifications |
| Erasure | Deleting data upon request or termination |

### A.2 Data Categories in Detail

| Category | Specific Data Elements |
|----------|------------------------|
| **Identity Data** | First name, last name, username |
| **Contact Data** | Email address, phone number, delivery address |
| **Transaction Data** | Order details, purchase history, payment references |
| **Technical Data** | IP address, browser type, device information |
| **Communication Data** | WhatsApp messages, voice recordings, support tickets |
| **Preference Data** | Marketing preferences, communication preferences |

### A.3 Retention Periods

| Data Type | Retention Period | Basis |
|-----------|------------------|-------|
| Account Data | Duration + 30 days | Contract performance |
| Transaction Records | 7 years | UK tax law |
| Communication Records | 3 years | Legitimate interest |
| Technical Logs | 90 days | Security |
| Voice Recordings | 90 days | Quality assurance |

---

## Annex B: Technical and Organisational Measures

### B.1 Access Control

| Measure | Implementation |
|---------|----------------|
| User Authentication | Email/password + optional MFA |
| Role-Based Access | Granular permissions by role |
| Session Management | Automatic timeout, single session option |
| Access Logging | All access attempts logged |

### B.2 Data Protection

| Measure | Implementation |
|---------|----------------|
| Encryption (Transit) | TLS 1.3 |
| Encryption (Rest) | AES-256 |
| Key Management | HSM-backed key storage |
| Backup Encryption | All backups encrypted |

### B.3 Infrastructure Security

| Measure | Implementation |
|---------|----------------|
| Hosting | ISO 27001 certified providers |
| Network | Firewalls, DDoS protection |
| Monitoring | 24/7 security monitoring |
| Patching | Regular security updates |

### B.4 Operational Security

| Measure | Implementation |
|---------|----------------|
| Staff Vetting | Background checks for personnel |
| Training | Annual security awareness training |
| Incident Response | Documented procedures |
| Business Continuity | Disaster recovery plan |

---

## Annex C: Sub-processor Details

### C.1 Supabase Inc.

| Attribute | Details |
|-----------|---------|
| **Service** | Database and authentication |
| **Location** | Frankfurt, Germany (EU) |
| **Data Processed** | All platform data |
| **Certifications** | SOC 2 Type II |
| **DPA** | Available at supabase.com/legal |

### C.2 Stripe Inc.

| Attribute | Details |
|-----------|---------|
| **Service** | Payment processing |
| **Location** | EU/US |
| **Data Processed** | Payment information |
| **Certifications** | PCI DSS Level 1 |
| **DPA** | Available at stripe.com/legal |

### C.3 Vercel Inc.

| Attribute | Details |
|-----------|---------|
| **Service** | Application hosting |
| **Location** | Global CDN |
| **Data Processed** | Application logs |
| **Certifications** | SOC 2 Type II |
| **DPA** | Available at vercel.com/legal |

### C.4 Meta Platforms (WhatsApp)

| Attribute | Details |
|-----------|---------|
| **Service** | WhatsApp Business API |
| **Location** | EU/US |
| **Data Processed** | Customer messages |
| **Certifications** | Various |
| **DPA** | Available via business.whatsapp.com |

### C.5 Vapi Inc.

| Attribute | Details |
|-----------|---------|
| **Service** | Voice AI processing |
| **Location** | US |
| **Data Processed** | Voice recordings |
| **Transfer Mechanism** | UK IDTA |
| **DPA** | Available upon request |

### C.6 Neo4j Inc.

| Attribute | Details |
|-----------|---------|
| **Service** | Graph database |
| **Location** | EU |
| **Data Processed** | Operational data |
| **Certifications** | SOC 2 Type II |
| **DPA** | Available at neo4j.com/legal |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | December 2024 | Legal Team | Initial document |

---

**IMPORTANT:** This Data Processing Agreement is a template and should be reviewed by a qualified legal professional before use. Specific terms may need adjustment based on actual sub-processors, data flows, and business operations.

---

## Signature

This DPA is incorporated into and forms part of the Terms of Service. By using the Àpínlẹ̀rọ platform, the Controller agrees to the terms of this DPA.

**For Àpínlẹ̀rọ Limited:**

Name: _______________________
Title: _______________________
Date: _______________________
Signature: ___________________

**For Controller:**

Name: _______________________
Title: _______________________
Date: _______________________
Signature: ___________________
