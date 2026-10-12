# Local-first: reader data lives on the device, no accounts at launch

Novelry launches as a free, ad-free app that stores all Reader data on the device, with Export for moving phones. This avoids hosting costs, GDPR exposure and account-deletion obligations. Optional sign-in and sync may come later, which is why `NovelryWebAPI` stays in the repo but is not shipped or deployed.

Considered: mandatory accounts with a cloud backend. Rejected for launch because the current API is fully unauthenticated and operating a public service is a cost and liability that is unjustified before demand is proven.
