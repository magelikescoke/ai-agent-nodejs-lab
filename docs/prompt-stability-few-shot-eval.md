# Prompt Stability Eval: Few-Shot vs No Few-Shot

Generated at: 2026-04-27T03:46:48.862Z
Model: GLM-4-FlashX-250414
Base URL: https://open.bigmodel.cn/api/paas/v4/

## Scope

- No few-shot: `ticket-analysis-v1`, 20 ticket cases.
- With few-shot: `ticket-analysis-v2`, the same 20 ticket cases.
- Output validation: strict ticket analysis schema plus expected category and priority match.

## Summary

| Prompt version | Accuracy | Schema pass | Category match | Priority match | Avg latency |
| --- | ---: | ---: | ---: | ---: | ---: |
| ticket-analysis-v1 | 0% (0/20) | 0/20 | 0/20 | 0/20 | 1100ms |
| ticket-analysis-v2 | 55% (11/20) | 20/20 | 19/20 | 12/20 | 1236ms |

## Original Prompts

### ticket-analysis-v1

System prompt:

```text
You are a support ticket triage assistant. Analyze the user ticket and return JSON only. Classify the ticket into exactly one allowed category. Categories: [billing,technical,account,complaint,other] Assign exactly one priority. Priorities: [low,medium,high,urgent] Keep overview and suggestedAction concise. Answer with a JSON string, Allowed fields: [category,priority,overview,suggestedAction], Example: {"category":"billing","priority":"medium","overview":"User has doubt about details of billing.","suggestedAction":"Check the amount of billing."}
```

### ticket-analysis-v2

System prompt:

```text
You are a support ticket triage assistant. Analyze the user ticket and return JSON only. Classify the ticket into exactly one allowed category. Categories: [billing,technical,account,complaint,other] Assign exactly one priority. Priorities: [low,medium,high,urgent] Keep overview and suggestedAction concise and operational. Priority guide: urgent means security risk, outage, data loss, or imminent duplicate charge; high means blocked work or strong dissatisfaction; medium means normal support follow-up; low means general information. Do not add fields outside [category,priority,overview,suggestedAction]. Few-shot examples: Ticket: "I was charged after canceling my plan." Output: {"category":"billing","priority":"high","overview":"User reports an unexpected charge after cancellation.","suggestedAction":"Review cancellation and billing history, then refund if confirmed."} Ticket: "The API returns 500 for every export request." Output: {"category":"technical","priority":"urgent","overview":"User reports API failures during export requests.","suggestedAction":"Check API error logs and recent export service changes."} Ticket: "I lost access to my admin email and cannot sign in." Output: {"category":"account","priority":"high","overview":"User cannot access the admin account email.","suggestedAction":"Verify ownership and start the account recovery flow."} Ticket: "Your agent ignored my messages and closed the case." Output: {"category":"complaint","priority":"high","overview":"User is dissatisfied with prior support handling.","suggestedAction":"Escalate for support quality review and reopen the case if needed."} Ticket: "Do you provide a security questionnaire for vendor review?" Output: {"category":"other","priority":"low","overview":"User asks for vendor security documentation.","suggestedAction":"Share the security questionnaire or direct the user to the vendor documentation."}
```

## Test Cases

| Case | Expected category | Expected priority | Input |
| --- | --- | --- | --- |
| ticket-001 | billing | high | I was charged twice for the same monthly subscription and need a refund. |
| ticket-002 | technical | high | The dashboard keeps returning a 500 error when I open the reports page. |
| ticket-003 | account | medium | I cannot reset my password because the verification email never arrives. |
| ticket-004 | complaint | high | Your support team closed my issue without solving it and I am very unhappy. |
| ticket-005 | other | low | Can you tell me whether you support annual plans for nonprofits? |
| ticket-006 | billing | medium | My invoice shows the wrong company tax ID and billing address. |
| ticket-007 | technical | high | File uploads fail whenever the CSV is larger than 10 MB. |
| ticket-008 | account | medium | Please change the owner email on our workspace admin account. |
| ticket-009 | complaint | high | The last agent was rude and ignored the details I sent three times. |
| ticket-010 | other | low | Where can I find your data processing agreement and security questionnaire? |
| ticket-011 | billing | high | The payment page keeps spinning after I enter my card details. |
| ticket-012 | technical | urgent | Our webhook endpoint stopped receiving delivery events after yesterday's deployment. |
| ticket-013 | account | high | I need to disable two-factor authentication because I lost my authenticator device. |
| ticket-014 | complaint | high | I have contacted support four times and nobody has fixed the problem. |
| ticket-015 | other | low | Do you have a public roadmap for upcoming integrations? |
| ticket-016 | billing | high | Please cancel my subscription and confirm that I will not be charged next month. |
| ticket-017 | technical | high | The API returns 429 even though we are below the documented rate limit. |
| ticket-018 | account | urgent | A former employee still has admin access to our organization. |
| ticket-019 | complaint | urgent | Your product lost our saved report and this is unacceptable for our team. |
| ticket-020 | other | low | Can you share your standard vendor onboarding form and support hours? |

## Failed Cases

### ticket-analysis-v1

| Case | Expected | Actual | Schema | Latency |
| --- | --- | --- | ---: | ---: |
| ticket-001 | billing / high | schema failed | false | 1097ms |
| ticket-002 | technical / high | schema failed | false | 1061ms |
| ticket-003 | account / medium | schema failed | false | 1020ms |
| ticket-004 | complaint / high | schema failed | false | 1191ms |
| ticket-005 | other / low | schema failed | false | 958ms |
| ticket-006 | billing / medium | schema failed | false | 1071ms |
| ticket-007 | technical / high | schema failed | false | 1102ms |
| ticket-008 | account / medium | schema failed | false | 786ms |
| ticket-009 | complaint / high | schema failed | false | 1471ms |
| ticket-010 | other / low | schema failed | false | 818ms |
| ticket-011 | billing / high | schema failed | false | 716ms |
| ticket-012 | technical / urgent | schema failed | false | 952ms |
| ticket-013 | account / high | schema failed | false | 1239ms |
| ticket-014 | complaint / high | schema failed | false | 1410ms |
| ticket-015 | other / low | schema failed | false | 1188ms |
| ticket-016 | billing / high | schema failed | false | 1425ms |
| ticket-017 | technical / high | schema failed | false | 1216ms |
| ticket-018 | account / urgent | schema failed | false | 960ms |
| ticket-019 | complaint / urgent | schema failed | false | 1270ms |
| ticket-020 | other / low | schema failed | false | 1044ms |

### ticket-analysis-v2

| Case | Expected | Actual | Schema | Latency |
| --- | --- | --- | ---: | ---: |
| ticket-002 | technical / high | technical / medium | true | 1078ms |
| ticket-007 | technical / high | technical / medium | true | 1054ms |
| ticket-011 | billing / high | technical / high | true | 710ms |
| ticket-012 | technical / urgent | technical / high | true | 1233ms |
| ticket-013 | account / high | account / medium | true | 2353ms |
| ticket-016 | billing / high | billing / medium | true | 975ms |
| ticket-017 | technical / high | technical / medium | true | 1387ms |
| ticket-018 | account / urgent | account / high | true | 1297ms |
| ticket-019 | complaint / urgent | complaint / high | true | 1451ms |


## Raw Results

### ticket-analysis-v1 / ticket-001

Expected: billing / high
Schema passed: false
Category matched: false
Priority matched: false
Latency: 1097ms

User prompt:

```text
I was charged twice for the same monthly subscription and need a refund.
```

Raw output:

````json
```json
{"category":"billing","priority":"high","overview":"User was charged twice for a monthly subscription.","suggestedAction":"Process refund for duplicate charge."}
```
````

### ticket-analysis-v1 / ticket-002

Expected: technical / high
Schema passed: false
Category matched: false
Priority matched: false
Latency: 1061ms

User prompt:

```text
The dashboard keeps returning a 500 error when I open the reports page.
```

Raw output:

````json
```json
{"category":"technical","priority":"high","overview":"Dashboard returns 500 error on reports page.","suggestedAction":"Check server logs for error details."}
```
````

### ticket-analysis-v1 / ticket-003

Expected: account / medium
Schema passed: false
Category matched: false
Priority matched: false
Latency: 1020ms

User prompt:

```text
I cannot reset my password because the verification email never arrives.
```

Raw output:

````json
```json
{"category":"technical","priority":"high","overview":"User unable to reset password due to missing verification email.","suggestedAction":"Verify email delivery and check spam folders."}
```
````

### ticket-analysis-v1 / ticket-004

Expected: complaint / high
Schema passed: false
Category matched: false
Priority matched: false
Latency: 1191ms

User prompt:

```text
Your support team closed my issue without solving it and I am very unhappy.
```

Raw output:

````json
```json
{"category":"complaint","priority":"high","overview":"User is unhappy with support team closing the issue without resolution.","suggestedAction":"Review the closed issue and reopen if unresolved."}
```
````

### ticket-analysis-v1 / ticket-005

Expected: other / low
Schema passed: false
Category matched: false
Priority matched: false
Latency: 958ms

User prompt:

```text
Can you tell me whether you support annual plans for nonprofits?
```

Raw output:

````json
```json
{"category":"account","priority":"low","overview":"User inquiring about support for annual plans for nonprofits.","suggestedAction":"Provide information on available plans for nonprofits."}
```
````

### ticket-analysis-v1 / ticket-006

Expected: billing / medium
Schema passed: false
Category matched: false
Priority matched: false
Latency: 1071ms

User prompt:

```text
My invoice shows the wrong company tax ID and billing address.
```

Raw output:

````json
```json
{"category":"billing","priority":"high","overview":"User's invoice has incorrect company tax ID and billing address.","suggestedAction":"Verify and update the invoice details."}
```
````

### ticket-analysis-v1 / ticket-007

Expected: technical / high
Schema passed: false
Category matched: false
Priority matched: false
Latency: 1102ms

User prompt:

```text
File uploads fail whenever the CSV is larger than 10 MB.
```

Raw output:

````json
```json
{"category":"technical","priority":"high","overview":"File uploads fail for CSV files larger than 10 MB.","suggestedAction":"Check server upload limits and file size restrictions."}
```
````

### ticket-analysis-v1 / ticket-008

Expected: account / medium
Schema passed: false
Category matched: false
Priority matched: false
Latency: 786ms

User prompt:

```text
Please change the owner email on our workspace admin account.
```

Raw output:

````json
```json
{"category":"account","priority":"medium","overview":"User requests a change of owner email on workspace admin account.","suggestedAction":"Verify current ownership and initiate email change process."}
```
````

### ticket-analysis-v1 / ticket-009

Expected: complaint / high
Schema passed: false
Category matched: false
Priority matched: false
Latency: 1471ms

User prompt:

```text
The last agent was rude and ignored the details I sent three times.
```

Raw output:

````json
```json
{"category":"complaint","priority":"high","overview":"User feels the last agent was rude and ignored their details.","suggestedAction":"Contact a supervisor to resolve the service issue."}
```
````

### ticket-analysis-v1 / ticket-010

Expected: other / low
Schema passed: false
Category matched: false
Priority matched: false
Latency: 818ms

User prompt:

```text
Where can I find your data processing agreement and security questionnaire?
```

Raw output:

````json
```json
{"category":"account","priority":"medium","overview":"User requests access to data processing agreement and security questionnaire.","suggestedAction":"Provide link to the documents in the user portal."}
```
````

### ticket-analysis-v1 / ticket-011

Expected: billing / high
Schema passed: false
Category matched: false
Priority matched: false
Latency: 716ms

User prompt:

```text
The payment page keeps spinning after I enter my card details.
```

Raw output:

````json
```json
{"category":"technical","priority":"high","overview":"Payment page spins indefinitely after entering card details.","suggestedAction":"Check payment gateway connection and card details."}
```
````

### ticket-analysis-v1 / ticket-012

Expected: technical / urgent
Schema passed: false
Category matched: false
Priority matched: false
Latency: 952ms

User prompt:

```text
Our webhook endpoint stopped receiving delivery events after yesterday's deployment.
```

Raw output:

````json
```json
{"category":"technical","priority":"high","overview":"Webhook endpoint stopped receiving delivery events post-deployment.","suggestedAction":"Verify webhook configuration and deployment logs."}
```
````

### ticket-analysis-v1 / ticket-013

Expected: account / high
Schema passed: false
Category matched: false
Priority matched: false
Latency: 1239ms

User prompt:

```text
I need to disable two-factor authentication because I lost my authenticator device.
```

Raw output:

````json
```json
{"category":"account","priority":"high","overview":"User lost authenticator device and needs to disable two-factor authentication.","suggestedAction":"Guide user through security steps to disable 2FA."}
```
````

### ticket-analysis-v1 / ticket-014

Expected: complaint / high
Schema passed: false
Category matched: false
Priority matched: false
Latency: 1410ms

User prompt:

```text
I have contacted support four times and nobody has fixed the problem.
```

Raw output:

````json
```json
{"category":"technical","priority":"high","overview":"User reports repeated unsuccessful attempts to fix a technical issue.","suggestedAction":"Escalate to senior technical support."}
```
````

### ticket-analysis-v1 / ticket-015

Expected: other / low
Schema passed: false
Category matched: false
Priority matched: false
Latency: 1188ms

User prompt:

```text
Do you have a public roadmap for upcoming integrations?
```

Raw output:

````json
```json
{"category":"other","priority":"low","overview":"User asking for public roadmap of upcoming integrations.","suggestedAction":"Check the public roadmap section on our website."}
```
````

### ticket-analysis-v1 / ticket-016

Expected: billing / high
Schema passed: false
Category matched: false
Priority matched: false
Latency: 1425ms

User prompt:

```text
Please cancel my subscription and confirm that I will not be charged next month.
```

Raw output:

````json
```json
{"category":"billing","priority":"medium","overview":"User requests subscription cancellation and confirmation of no future charges.","suggestedAction":"Process subscription cancellation and confirm no future charges."}
```
````

### ticket-analysis-v1 / ticket-017

Expected: technical / high
Schema passed: false
Category matched: false
Priority matched: false
Latency: 1216ms

User prompt:

```text
The API returns 429 even though we are below the documented rate limit.
```

Raw output:

````json
```json
{"category":"technical","priority":"high","overview":"API returns 429 even though rate limit is not exceeded.","suggestedAction":"Verify rate limit configuration and API usage logs."}
```
````

### ticket-analysis-v1 / ticket-018

Expected: account / urgent
Schema passed: false
Category matched: false
Priority matched: false
Latency: 960ms

User prompt:

```text
A former employee still has admin access to our organization.
```

Raw output:

````json
```json
{"category":"account","priority":"high","overview":"A former employee retains admin access.","suggestedAction":"Revoke admin access immediately."}
```
````

### ticket-analysis-v1 / ticket-019

Expected: complaint / urgent
Schema passed: false
Category matched: false
Priority matched: false
Latency: 1270ms

User prompt:

```text
Your product lost our saved report and this is unacceptable for our team.
```

Raw output:

````json
```json
{"category":"complaint","priority":"high","overview":"User reports loss of saved report, stating it is unacceptable for the team.","suggestedAction":"Investigate report loss and restore the saved report."}
```
````

### ticket-analysis-v1 / ticket-020

Expected: other / low
Schema passed: false
Category matched: false
Priority matched: false
Latency: 1044ms

User prompt:

```text
Can you share your standard vendor onboarding form and support hours?
```

Raw output:

````json
```json
{"category":"account","priority":"medium","overview":"User requests information about vendor onboarding form and support hours.","suggestedAction":"Provide the vendor onboarding form and support hours information."}
```
````

### ticket-analysis-v2 / ticket-001

Expected: billing / high
Schema passed: true
Category matched: true
Priority matched: true
Latency: 933ms

User prompt:

```text
I was charged twice for the same monthly subscription and need a refund.
```

Raw output:

```json
{"category":"billing","priority":"high","overview":"User reports duplicate charge for monthly subscription.","suggestedAction":"Verify duplicate charge and process refund immediately."}
```

### ticket-analysis-v2 / ticket-002

Expected: technical / high
Schema passed: true
Category matched: true
Priority matched: false
Latency: 1078ms

User prompt:

```text
The dashboard keeps returning a 500 error when I open the reports page.
```

Raw output:

```json
{"category":"technical","priority":"medium","overview":"User reports recurring 500 errors on the reports page.","suggestedAction":"Check server logs for the 500 errors and investigate the reports page components."}
```

### ticket-analysis-v2 / ticket-003

Expected: account / medium
Schema passed: true
Category matched: true
Priority matched: true
Latency: 1344ms

User prompt:

```text
I cannot reset my password because the verification email never arrives.
```

Raw output:

```json
{"category":"account","priority":"medium","overview":"User unable to reset password due to missing verification email.","suggestedAction":"Check email filters/spam and verify the registered email address."}
```

### ticket-analysis-v2 / ticket-004

Expected: complaint / high
Schema passed: true
Category matched: true
Priority matched: true
Latency: 865ms

User prompt:

```text
Your support team closed my issue without solving it and I am very unhappy.
```

Raw output:

```json
{"category":"complaint","priority":"high","overview":"User is unhappy with unresolved issue and closed ticket.","suggestedAction":"Review the closed ticket and reopen for resolution."}
```

### ticket-analysis-v2 / ticket-005

Expected: other / low
Schema passed: true
Category matched: true
Priority matched: true
Latency: 1406ms

User prompt:

```text
Can you tell me whether you support annual plans for nonprofits?
```

Raw output:

```json
{"category":"other","priority":"low","overview":"User inquiring about support for annual plans for nonprofits.","suggestedAction":"Provide information on available plans and discounts for nonprofits."}
```

### ticket-analysis-v2 / ticket-006

Expected: billing / medium
Schema passed: true
Category matched: true
Priority matched: true
Latency: 1423ms

User prompt:

```text
My invoice shows the wrong company tax ID and billing address.
```

Raw output:

```json
{"category":"billing","priority":"medium","overview":"User reports incorrect tax ID and billing address on the invoice.","suggestedAction":"Verify and correct the invoice details in the system."}
```

### ticket-analysis-v2 / ticket-007

Expected: technical / high
Schema passed: true
Category matched: true
Priority matched: false
Latency: 1054ms

User prompt:

```text
File uploads fail whenever the CSV is larger than 10 MB.
```

Raw output:

```json
{"category":"technical","priority":"medium","overview":"User reports file upload failures for large CSV files.","suggestedAction":"Check server limits and file handling for uploads."}
```

### ticket-analysis-v2 / ticket-008

Expected: account / medium
Schema passed: true
Category matched: true
Priority matched: true
Latency: 1757ms

User prompt:

```text
Please change the owner email on our workspace admin account.
```

Raw output:

```json
{"category":"account","priority":"medium","overview":"User requests a change to the workspace admin account's owner email.","suggestedAction":"Verify current admin permissions and update the email address in the account settings."}
```

### ticket-analysis-v2 / ticket-009

Expected: complaint / high
Schema passed: true
Category matched: true
Priority matched: true
Latency: 735ms

User prompt:

```text
The last agent was rude and ignored the details I sent three times.
```

Raw output:

```json
{"category":"complaint","priority":"high","overview":"User reports poor service and ignored communication.","suggestedAction":"Escalate for support quality review and assign a new agent."}
```

### ticket-analysis-v2 / ticket-010

Expected: other / low
Schema passed: true
Category matched: true
Priority matched: true
Latency: 927ms

User prompt:

```text
Where can I find your data processing agreement and security questionnaire?
```

Raw output:

```json
{"category":"other","priority":"low","overview":"User requests access to data processing agreement and security questionnaire.","suggestedAction":"Provide links to the documents or direct to the legal/privacy section."}
```

### ticket-analysis-v2 / ticket-011

Expected: billing / high
Schema passed: true
Category matched: false
Priority matched: true
Latency: 710ms

User prompt:

```text
The payment page keeps spinning after I enter my card details.
```

Raw output:

```json
{"category":"technical","priority":"high","overview":"User reports payment page failure after entering card details.","suggestedAction":"Check payment gateway connection and test card input functionality."}
```

### ticket-analysis-v2 / ticket-012

Expected: technical / urgent
Schema passed: true
Category matched: true
Priority matched: false
Latency: 1233ms

User prompt:

```text
Our webhook endpoint stopped receiving delivery events after yesterday's deployment.
```

Raw output:

```json
{"category":"technical","priority":"high","overview":"Webhook endpoint not receiving delivery events post-deployment.","suggestedAction":"Verify deployment changes and test webhook connectivity."}
```

### ticket-analysis-v2 / ticket-013

Expected: account / high
Schema passed: true
Category matched: true
Priority matched: false
Latency: 2353ms

User prompt:

```text
I need to disable two-factor authentication because I lost my authenticator device.
```

Raw output:

```json
{"category":"account","priority":"medium","overview":"User lost authenticator device and requests 2FA disabling.","suggestedAction":"Verify user identity and guide through 2FA disabling steps."}
```

### ticket-analysis-v2 / ticket-014

Expected: complaint / high
Schema passed: true
Category matched: true
Priority matched: true
Latency: 973ms

User prompt:

```text
I have contacted support four times and nobody has fixed the problem.
```

Raw output:

```json
{"category":"complaint","priority":"high","overview":"User reports repeated unsuccessful support attempts.","suggestedAction":"Escalate the unresolved issue to a senior support agent."}
```

### ticket-analysis-v2 / ticket-015

Expected: other / low
Schema passed: true
Category matched: true
Priority matched: true
Latency: 1376ms

User prompt:

```text
Do you have a public roadmap for upcoming integrations?
```

Raw output:

```json
{"category":"other","priority":"low","overview":"User requests information on upcoming integrations.","suggestedAction":"Direct the user to the public roadmap page or integration documentation."}
```

### ticket-analysis-v2 / ticket-016

Expected: billing / high
Schema passed: true
Category matched: true
Priority matched: false
Latency: 975ms

User prompt:

```text
Please cancel my subscription and confirm that I will not be charged next month.
```

Raw output:

```json
{"category":"billing","priority":"medium","overview":"User requests subscription cancellation and confirmation of no future charges.","suggestedAction":"Cancel subscription and verify no charges will occur next month."}
```

### ticket-analysis-v2 / ticket-017

Expected: technical / high
Schema passed: true
Category matched: true
Priority matched: false
Latency: 1387ms

User prompt:

```text
The API returns 429 even though we are below the documented rate limit.
```

Raw output:

```json
{"category":"technical","priority":"medium","overview":"User reports API receiving 429 status despite adhering to documented rate limits.","suggestedAction":"Verify rate limit configuration and check for recent changes in API traffic."}
```

### ticket-analysis-v2 / ticket-018

Expected: account / urgent
Schema passed: true
Category matched: true
Priority matched: false
Latency: 1297ms

User prompt:

```text
A former employee still has admin access to our organization.
```

Raw output:

```json
{"category":"account","priority":"high","overview":"Former employee retains admin access.","suggestedAction":"Revoke their access immediately and review access management policies."}
```

### ticket-analysis-v2 / ticket-019

Expected: complaint / urgent
Schema passed: true
Category matched: true
Priority matched: false
Latency: 1451ms

User prompt:

```text
Your product lost our saved report and this is unacceptable for our team.
```

Raw output:

```json
{"category":"complaint","priority":"high","overview":"User reports loss of a saved report, expressing strong dissatisfaction.","suggestedAction":"Investigate report loss and restore the saved report if possible."}
```

### ticket-analysis-v2 / ticket-020

Expected: other / low
Schema passed: true
Category matched: true
Priority matched: true
Latency: 1448ms

User prompt:

```text
Can you share your standard vendor onboarding form and support hours?
```

Raw output:

```json
{"category":"other","priority":"low","overview":"User requests access to vendor onboarding form and support hours.","suggestedAction":"Provide the form and support hours information."}
```

