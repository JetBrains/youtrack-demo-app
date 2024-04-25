# YouTrack Demo App

[![JetBrains team project](http://jb.gg/badges/team.svg)](https://confluence.jetbrains.com/display/ALL/JetBrains+on+GitHub)

Once installed into [JetBrains YouTrack](https://www.jetbrains.com/youtrack/), this App utilizes available extension points for demo reasons.

### Installation

#### Manual way

1. Archive "src" folder into a single ZIP file
2. Go to `%YOUTRACK_URL%/admin/apps` (you need admin permissions to do so)
3. Import app from ZIP archive
4. Attach app to desired projects on `%YOUTRACK_URL%/admin/editProject/%PROJECT_ID%?tab=apps` page
5. Open an issue in desired project and check App widgets appear

#### CLI way (useful for developing)

1. `npm install`
2. `YOUTRACK_URL="YOUR_YOUTRACK_URL_HERE" npm run pack && npm run upload -- --token perm:cm9vdA==.NTA...`, where token is a permanent token, granted on `%YOUTRACK_URL%/youtrack/users/me?tab=account-security`
3. Attach to desired projects, as described above
4. Apply changes to sources and repat p.2 