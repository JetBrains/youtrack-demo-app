# YouTrack Demo App

![Team](https://jb.gg/badges/team-plastic.svg)

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
2. `npm run build && npm run upload -- --host %YOUTRACK_URL% --token perm:cm9vdA==.NT...`, where token is a permanent token, granted on `%YOUTRACK_URL%/youtrack/users/me?tab=account-security`
3. Attach to desired projects, as described above
4. Apply changes to sources and repat p.2 
