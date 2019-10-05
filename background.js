// Java API Search: a Google Chrome Omnibox extension
//  - Andrew Watson

'use strict';

// listen for the user to confirm a command sent to the omnibox
chrome.omnibox.onInputEntered.addListener(
  function(input) {

    // split input string on spaces, first "word" (if numeric) is Java version
    var apiver = parseInt(input.split(" ")[0]);

    // Java 11 API (default -- most recent LTS version)
    var apiurl = "https://docs.oracle.com/en/java/javase/11/docs/api/index.html";

    // read the user-defined API version (9, 10, 11, 12, or 13), if it exists
    switch (apiver) {

      // Java 9 API
      case 9:
        apiurl = "https://docs.oracle.com/javase/9/docs/api/overview-summary.html";
        input = input.split(" ").splice(1).join(" ");
        break;

      // Java 10 API
      case 10:
        apiurl = "https://docs.oracle.com/javase/10/docs/api/overview-summary.html";
        input = input.split(" ").splice(1).join(" ");
        break;

      // skip Java 11 API URL (see 'default' above)
      case 11:
        input = input.split(" ").splice(1).join(" ");
        break;

      // Java 12 API
      case 12:
        apiurl = "https://docs.oracle.com/en/java/javase/12/docs/api/index.html";
        input = input.split(" ").splice(1).join(" ");
        break;

      // Java 13 API
      case 13:
        apiurl = "https://docs.oracle.com/en/java/javase/13/docs/api/index.html";
        input = input.split(" ").splice(1).join(" ");
        break;

      // default, set version to 11
      default:
        apiver = 11;
    }

    // move to appropriate Javadoc page
    chrome.tabs.update(null, { url: apiurl },

      // callback function, after we've moved to the above URL...
      function() { var handbrake = 50;

        // "cleared" is set to true when the interval loop is exited
        var cleared = false;

        // check for presence of "search" input every 50ms until found
        var interval = setInterval(function() {

          // manually quit loop if finding input box takes too long (5s+)
          if (--handbrake < 0) {
            alert("Java API search timeout");
            clearInterval(interval);
          }

          // check that <input id="search"> is non-null
          chrome.tabs.executeScript(null, {
            code: "document.getElementById('search')"

          // run the above 'getElementById()' every 50ms and inspect the results
          }, function(results) {

            // asynchronous, so if we've already done this, quit
            if (cleared) return;

            // if search input not rendered yet, return
            if (typeof results === undefined || results == null) return;

            // as soon as it's non-null, set its value
            chrome.tabs.executeScript(null, {
              code: `

                // "return" / "enter" keypress
                var key_re = new KeyboardEvent("keydown", { keyCode: 13 });

                // "left arrow" keypress
                var key_la = new KeyboardEvent("keydown", { keyCode: 37 });

                setTimeout(function() {

                  // set input search text
                  var searchinput = document.getElementById('search');
                  searchinput.value = '${input}';

                  // "left arrow" keypress in input to activate search
                  searchinput.dispatchEvent(key_la);

                  // listen for search result box to appear on page
                  var observer = new MutationObserver(function(mutations) {

                    for (const mut of mutations) {
                      if (mut.oldValue.includes("display: none")) {

                        if (target.firstElementChild.getAttribute("aria-label") == "No results found")
                          alert('No results found for "${input}"');
                        else
                          searchinput.dispatchEvent(key_re);

                        observer.disconnect();
                        break;
                      }
                    }
 
                  });

                  // search result box
                  var target = document.getElementById('ui-id-1');
                  observer.observe(target, { attributes: true, attributeFilter: ['style'], attributeOldValue: true});

                // scripts on v10+ pages cause "search" input to be updated so we have to wait until they're finished
                }, 1500);

              `
            });

            // as soon as "search" input is non-null, stop listening for it
            cleared = true;
          });

          // end 50ms loop looking for "search" input
          if (cleared) clearInterval(interval); 
        }, 50); 

    });
  });