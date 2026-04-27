# Prompt Stability Eval: Few-Shot vs No Few-Shot

Generated at: 2026-04-27T03:19:54.894Z
Model: GLM-4-FlashX-250414
Base URL: https://open.bigmodel.cn/api/paas/v4/

## Scope

- No few-shot: `ticket-analysis-v1`, 10 ticket cases.
- With few-shot: `ticket-analysis-v2`, the same 10 ticket cases.
- Output validation: strict ticket analysis schema plus expected category match.

## Summary

| Prompt version     | Schema pass | Category match | Avg latency |
| ------------------ | ----------: | -------------: | ----------: |
| ticket-analysis-v1 |        2/10 |           2/10 |      5097ms |
| ticket-analysis-v2 |       10/10 |          10/10 |      3494ms |

## Original Prompts

### ticket-analysis-v1

System prompt:

```text
You are a support ticket triage assistant. Analyze the user ticket and return JSON only. Classify the ticket into exactly one allowed category. Categories: [billing,technical,account,complaint,other] Keep overview and suggestedAction concise. Answer with a JSON string, Allowed fields: [category,overview,suggestedAction], Example: {"category":"billing","overview":"User has doubt about details of billing.","suggestedAction":"Check the amount of billing."}
```

### ticket-analysis-v2

System prompt:

```text
You are a support ticket triage assistant. Analyze the user ticket and return JSON only. Classify the ticket into exactly one allowed category. Categories: [billing,technical,account,complaint,other] Keep overview and suggestedAction concise and operational. Do not add fields outside [category,overview,suggestedAction]. Few-shot examples: Ticket: "I was charged after canceling my plan." Output: {"category":"billing","overview":"User reports an unexpected charge after cancellation.","suggestedAction":"Review cancellation and billing history, then refund if confirmed."} Ticket: "The API returns 500 for every export request." Output: {"category":"technical","overview":"User reports API failures during export requests.","suggestedAction":"Check API error logs and recent export service changes."} Ticket: "I lost access to my admin email and cannot sign in." Output: {"category":"account","overview":"User cannot access the admin account email.","suggestedAction":"Verify ownership and start the account recovery flow."} Ticket: "Your agent ignored my messages and closed the case." Output: {"category":"complaint","overview":"User is dissatisfied with prior support handling.","suggestedAction":"Escalate for support quality review and reopen the case if needed."} Ticket: "Do you provide a security questionnaire for vendor review?" Output: {"category":"other","overview":"User asks for vendor security documentation.","suggestedAction":"Share the security questionnaire or direct the user to the vendor documentation."}
```

## Test Cases

| Case       | Expected category | Content                                                                     |
| ---------- | ----------------- | --------------------------------------------------------------------------- |
| ticket-001 | billing           | I was charged twice for the same monthly subscription and need a refund.    |
| ticket-002 | technical         | The dashboard keeps returning a 500 error when I open the reports page.     |
| ticket-003 | account           | I cannot reset my password because the verification email never arrives.    |
| ticket-004 | complaint         | Your support team closed my issue without solving it and I am very unhappy. |
| ticket-005 | other             | Can you tell me whether you support annual plans for nonprofits?            |
| ticket-006 | billing           | My invoice shows the wrong company tax ID and billing address.              |
| ticket-007 | technical         | File uploads fail whenever the CSV is larger than 10 MB.                    |
| ticket-008 | account           | Please change the owner email on our workspace admin account.               |
| ticket-009 | complaint         | The last agent was rude and ignored the details I sent three times.         |
| ticket-010 | other             | Where can I find your data processing agreement and security questionnaire? |

## Raw Results

### ticket-analysis-v1 / ticket-001

Expected category: billing
Schema passed: true
Category matched: true
Latency: 1863ms

User prompt:

```text
I was charged twice for the same monthly subscription and need a refund.
```

Raw output:

```json
{
  "category": "billing",
  "overview": "User was charged twice for a monthly subscription.",
  "suggestedAction": "Process a refund for the duplicate charge."
}
```

### ticket-analysis-v1 / ticket-002

Expected category: technical
Schema passed: false
Category matched: false
Latency: 14722ms

User prompt:

```text
The dashboard keeps returning a 500 error when I open the reports page.
```

Raw output:

````json
```json
{"category":"technical","overview":"Dashboard returns 500 error on reports page.","suggestedAction":"Check server logs for error details."}
```
````

### ticket-analysis-v1 / ticket-003

Expected category: account
Schema passed: false
Category matched: false
Latency: 3895ms

User prompt:

```text
I cannot reset my password because the verification email never arrives.
```

Raw output:

````json
```json
{"category":"technical","overview":"User unable to reset password due to missing verification email.","suggestedAction":"Check email spam folder and verify email address."}
```
````

### ticket-analysis-v1 / ticket-004

Expected category: complaint
Schema passed: false
Category matched: false
Latency: 2745ms

User prompt:

```text
Your support team closed my issue without solving it and I am very unhappy.
```

Raw output:

````json
```json
{"category":"complaint","overview":"User is unhappy with the closure of an unresolved issue.","suggestedAction":"Review the closed issue and reopen if necessary."}
```
````

### ticket-analysis-v1 / ticket-005

Expected category: other
Schema passed: false
Category matched: false
Latency: 4568ms

User prompt:

```text
Can you tell me whether you support annual plans for nonprofits?
```

Raw output:

````json
```json
{"category":"account","overview":"User inquiring about support for annual plans for nonprofits.","suggestedAction":"Check nonprofit plan options."}
```
````

### ticket-analysis-v1 / ticket-006

Expected category: billing
Schema passed: false
Category matched: false
Latency: 4923ms

User prompt:

```text
My invoice shows the wrong company tax ID and billing address.
```

Raw output:

````json
```json
{"category":"billing","overview":"User reported incorrect company tax ID and billing address on the invoice.","suggestedAction":"Verify and update the invoice details."}
```
````

### ticket-analysis-v1 / ticket-007

Expected category: technical
Schema passed: false
Category matched: false
Latency: 3339ms

User prompt:

```text
File uploads fail whenever the CSV is larger than 10 MB.
```

Raw output:

````json
```json
{"category":"technical","overview":"File uploads fail for CSV files larger than 10 MB.","suggestedAction":"Check upload size limit and file format."}
```
````

### ticket-analysis-v1 / ticket-008

Expected category: account
Schema passed: true
Category matched: true
Latency: 4065ms

User prompt:

```text
Please change the owner email on our workspace admin account.
```

Raw output:

```json
{
  "category": "account",
  "overview": "User requests a change in the owner email for the workspace admin account.",
  "suggestedAction": "Guide user through account settings to change owner email."
}
```

### ticket-analysis-v1 / ticket-009

Expected category: complaint
Schema passed: false
Category matched: false
Latency: 9677ms

User prompt:

```text
The last agent was rude and ignored the details I sent three times.
```

Raw output:

````json
```json
{"category":"complaint","overview":"User feels the last agent was rude and ignored their details.","suggestedAction":"Contact a supervisor for further assistance."}
```
````

### ticket-analysis-v1 / ticket-010

Expected category: other
Schema passed: false
Category matched: false
Latency: 1177ms

User prompt:

```text
Where can I find your data processing agreement and security questionnaire?
```

Raw output:

````json
```json
{"category":"account","overview":"User requests information on data processing agreement and security questionnaire.","suggestedAction":"Provide links to the data processing agreement and security questionnaire."}
```
````

### ticket-analysis-v2 / ticket-001

Expected category: billing
Schema passed: true
Category matched: true
Latency: 1530ms

User prompt:

```text
I was charged twice for the same monthly subscription and need a refund.
```

Raw output:

```json
{
  "category": "billing",
  "overview": "User reports being charged twice for a monthly subscription.",
  "suggestedAction": "Verify the charge and process a refund for the duplicate payment."
}
```

### ticket-analysis-v2 / ticket-002

Expected category: technical
Schema passed: true
Category matched: true
Latency: 1640ms

User prompt:

```text
The dashboard keeps returning a 500 error when I open the reports page.
```

Raw output:

```json
{
  "category": "technical",
  "overview": "User reports a 500 error on the reports page of the dashboard.",
  "suggestedAction": "Check server logs for the 500 error and investigate the reports page functionality."
}
```

### ticket-analysis-v2 / ticket-003

Expected category: account
Schema passed: true
Category matched: true
Latency: 1278ms

User prompt:

```text
I cannot reset my password because the verification email never arrives.
```

Raw output:

```json
{
  "category": "account",
  "overview": "User unable to reset password due to missing verification email.",
  "suggestedAction": "Verify email delivery and check spam folders, then resend the verification email."
}
```

### ticket-analysis-v2 / ticket-004

Expected category: complaint
Schema passed: true
Category matched: true
Latency: 1386ms

User prompt:

```text
Your support team closed my issue without solving it and I am very unhappy.
```

Raw output:

```json
{
  "category": "complaint",
  "overview": "User is unhappy with unresolved issue and closed ticket.",
  "suggestedAction": "Review the closed ticket and reopen for resolution, then follow up with the user."
}
```

### ticket-analysis-v2 / ticket-005

Expected category: other
Schema passed: true
Category matched: true
Latency: 12124ms

User prompt:

```text
Can you tell me whether you support annual plans for nonprofits?
```

Raw output:

```json
{
  "category": "other",
  "overview": "User inquiring about annual plan support for nonprofits.",
  "suggestedAction": "Provide information on available plans and nonprofit discounts."
}
```

### ticket-analysis-v2 / ticket-006

Expected category: billing
Schema passed: true
Category matched: true
Latency: 1324ms

User prompt:

```text
My invoice shows the wrong company tax ID and billing address.
```

Raw output:

```json
{
  "category": "billing",
  "overview": "User reports incorrect company tax ID and billing address on the invoice.",
  "suggestedAction": "Verify and correct the invoice details in the system."
}
```

### ticket-analysis-v2 / ticket-007

Expected category: technical
Schema passed: true
Category matched: true
Latency: 11349ms

User prompt:

```text
File uploads fail whenever the CSV is larger than 10 MB.
```

Raw output:

```json
{
  "category": "technical",
  "overview": "User reports file upload failures for large CSV files.",
  "suggestedAction": "Investigate upload limits and CSV processing in the system."
}
```

### ticket-analysis-v2 / ticket-008

Expected category: account
Schema passed: true
Category matched: true
Latency: 1377ms

User prompt:

```text
Please change the owner email on our workspace admin account.
```

Raw output:

```json
{
  "category": "account",
  "overview": "User requests a change to the workspace admin account's owner email.",
  "suggestedAction": "Verify current admin privileges and update the email address in the account settings."
}
```

### ticket-analysis-v2 / ticket-009

Expected category: complaint
Schema passed: true
Category matched: true
Latency: 1425ms

User prompt:

```text
The last agent was rude and ignored the details I sent three times.
```

Raw output:

```json
{
  "category": "complaint",
  "overview": "User reports a rude agent who ignored provided details.",
  "suggestedAction": "Escalate for agent conduct review and ensure the issue is addressed."
}
```

### ticket-analysis-v2 / ticket-010

Expected category: other
Schema passed: true
Category matched: true
Latency: 1505ms

User prompt:

```text
Where can I find your data processing agreement and security questionnaire?
```

Raw output:

```json
{
  "category": "other",
  "overview": "User requests access to data processing agreement and security questionnaire.",
  "suggestedAction": "Provide links to the documents or direct to the relevant section in the knowledge base."
}
```
