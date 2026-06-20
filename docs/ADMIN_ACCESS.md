# Admin Access

The static portfolio now has an Owner Console.

```text
Admin password: Pratik@123
```

## What Admin Can Do

- Verify admin mode.
- Stay verified in the same browser for 2 weeks unless admin mode is exited.
- Edit every content collection through the JSON editor.
- Toggle public visibility for each page.
- View pages even when they are hidden from visitors.
- Reset sample data.

## What Visitors Can Do

- View public pages only.
- They cannot access the editor unless they know the admin password.
- Clicking `Update Site` asks for verification before editing is available.
- If a visitor opens a hidden route directly, the app redirects them to the first public page.

## Important Security Note

This is a static frontend app. The password check prevents ordinary UI access, but it is not equivalent to server-side security because browser code can be inspected. For production-grade protection, add backend authentication and move admin writes to protected API routes.
