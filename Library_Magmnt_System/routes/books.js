const express = require("express"),
      router = express.Router();


// Importing controller
const bookController = require('../controllers/books');

// Browse books
router.get("/books/:filter/:value/:page", bookController.getBooks);

// Fetch books by search value
router.post("/books/:filter/:value/:page", bookController.findBooks);

// Fetch individual book details
router.get("/books/details/:book_id", bookController.getBookDetails);

//router.post("/books/:book_id/issue/:userId", bookController.putIssuedBooks); It is not required, since User ID is mentiond
// Automatically Node picks the user controller

module.exports = router;