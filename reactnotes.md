# Notes about ReactJS

- The site's base is at index.html, and all the React code is imported as JavaScript code.
  - This is why, for the guestbook, we needed to put the form in the HTML!
- main.jsx imports ReactJS, its associated render, the app, essential CSS, and the router function.
  - ``<App />`` is an example of a self-closing tag - this is cool and we should try to use it!
  - ``<BrowserRouter>`` lets us have different pages without reloading the page. If we got rid of this things would still work, just slower, and we'd have to import each page individually.
  - ``<React.StrictMode>`` is a dev tool.
- app.jsx imports the router, along with our pages.
  - Notice how it says ``import {Routes, Route} from "react-router-dom";``. It's pulling the functions it needs and your compiler (vite, in our case) strips everything we don't need.
    - This is something to review in the optimization phase!
    - Routes is the ``<ul>`` and Route is the ``<li>``.
- *Everything in React is a function!*
  - This includes our pages. Using the home page as an example, ``import HomePage from "./pages/HomePage";`` is importing the function called Homepage from that file. The "function" is literally just declaring the function, then returning the value in the file. It does nothing special.
- In order of easiest to understand to hardest...
  - ResumePage.jsx and HomePage.jsx
    - Yeah dawg, this one's literally just basic HTML.
    - The one piece of spice is the ``<Link to "/" className="geocities-button">`` on the bottom. This is basically an ``<a>`` tag, but ``Link`` is pulled from the React router function. You *could* use an ``<a>`` tag, but you don't want to because of load times.
  - ProjectsPage.jsx
  - GuestbookPage.jsx
