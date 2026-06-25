from sdk.hf_sdk import FirewalledClient

client = FirewalledClient(api_key="gsk_your_key_here")
result = client.complete("When was the Eiffel Tower built and where is it?")

print("Answer     :", result.answer)
print("Risk Score :", result.risk_score)
print("Action     :", result.action_taken)
print("Flagged    :", result.flagged_claims)
print("Rewritten? :", result.rewritten)