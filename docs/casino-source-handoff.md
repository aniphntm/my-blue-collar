# MyBlueCasino source handoff

Recovered September 8, 2026 from Blue Collar commit c36ab88d997dff1d88d925fe19729168575aef27 (August 28 UTC).

This casino branch preserves the historical /casino implementation before commit 76a7505 replaced it with a rewrite to a separate deployment. It is NOT a verified copy of the current mybluecasino-us deployment. The historical form is a prototype; do not treat it as a working signup backend or deploy this branch over production.

Requested destination: a new repository named mybluecasino under aniphntm, displayed as MyBlueCasino. That repository has not been created; the connected GitHub tool cannot create repositories. Existing Vercel project mybluecasino-us (team myblue) is CLI-deployed and has no Git link. Connected Vercel tools cannot modify that link.

Next steps:
1. Create an empty private aniphntm/mybluecasino repository and expose it to the GitHub connection.
2. Recover source for production deployment dpl_5nKZwhxjNMUygojebuwGjzp1KG2A from its original checkout/export. Compare it to app/casino here before choosing the initial source.
3. Extract the verified casino app and required dependencies into the new repository. Preserve source attribution/history and omit secrets.
4. Link Vercel mybluecasino-us to that repository, keeping project/environment values and existing production alias intact. Verify a preview before promoting.
5. Verify whether the deployed app serves / or /casino; only then fix Blue Collar's /casino rewrite.

No current production routes, Git connections, or domains were changed by this handoff.
