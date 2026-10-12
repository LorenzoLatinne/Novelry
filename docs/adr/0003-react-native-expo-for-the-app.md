# The app is rebuilt in React Native with Expo and TypeScript

The .NET MAUI app is replaced by a React Native (Expo, TypeScript) app. Login, storage, the book source, Goals, Recommendations and Export were all being reworked anyway, so the saving from staying on MAUI was small, while React Native has the stronger ecosystem (camera scanning, SQLite, file sharing), simpler store builds and wider career relevance.

The MAUI app stays in the repo as reference until the new app reaches parity. `NovelryWebAPI` and `NovelryDTO` remain, unshipped, as the future sync layer (ADR-0001).
