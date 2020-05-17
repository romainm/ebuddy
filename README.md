---

To Read:

-   electron forge

Todo:

-   keep track of imports and allow to 
-   - list them: when, show transactions
-   - clear associated translation
-   add computed current balance on accounts
-   search by anything (name, category, amount ("<1000 >30"))
-   graph past data by search result
-   ability to save search queries for graph so we can reuse it later on
-   all categories graphed for the past n months/years (and save as reusable chart)
-   net worth chart
-   transaction chart:
    -   per week, month, quarter, year quick grouping (button)
    -   ability to remove points from graph when they are too different than the rest of the data and affect the scale too much.
-   transactions:
    -   select all
-   use tabulator for now or find another table that supports paging or virtual dom
-   graph:
-   -   data should come from server using same filter. Potentially use a lot mor transactions.

database links:

-   https://github.com/kripken/sql.js/
-   https://stackoverflow.com/questions/32504307/how-to-use-sqlite3-module-with-electron
-   https://github.com/mandel59/sqlite-wasm
-   https://trilogy.js.org/guide/
-   https://github.com/louischatriot/nedb/

good reading about electron main vs renderer processes and their communication:

-   https://www.brainbell.com/javascript/ipc-communication.html
-   https://www.brainbell.com/javascript/remote-module.html
