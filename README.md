# AG-DOK-Map
## Data Download
To start, perform a `cp inc.filmdata.php.example inc.filmdata.php` and replace the secret with your gsheet sheet id.

## Automatic data refresh
To enable automatic data refresh, just add a cron entry to your webservers crontab, e.g.
```* */6 * * * php get-gsheet-json.php >/dev/null 2>&1```