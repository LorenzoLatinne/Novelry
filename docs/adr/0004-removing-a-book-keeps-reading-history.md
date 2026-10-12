# Removing a Book from the Library keeps the Reader's reading history

Removing a Book deletes only its Library Entry (Shelf and current page). Reviews and Reading Sessions are the Reader's own history and are kept, as are the Book's saved details. Reading Goal progress and Achievements are derived from that history, so deleting it on removal would silently lower them. Re-adding a Book starts a fresh Library Entry on Want to read; its earlier Reviews and Sessions are still there. "Delete all data" in Settings is the only way to erase history.

Considered: deleting Reviews and Sessions together with the Library Entry. Rejected because a tidy-up would then change Goals and Achievements. Reviews and Sessions tickets (#13, #15) must test that removal leaves them intact.
