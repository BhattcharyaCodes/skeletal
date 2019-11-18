# skeletal
a skeletal framework of how a test automation project should look like

#Test cases for automation of google search engine using Protractor/Jasmine for wiritng e2e test scripts.
1 Assert that the browser openend the correct url : "open the google search engine".

2 Assert that the google logo image is loaded on the search page.

3 If you enterd nothing and just clicked search the nothing should be occur.
4 Assert that the search for the input text is a success.
5 Assert that the Minimum and Maximum lengths should be set for all the text boxes.
6 If you entered Special Characters like !,@,#,$ etc it should not search anything.

7 Assert that the search for the input loads image result which can be clicked.
8 Assert that the search for the input loads video result which can be clicked.
9 Assert that the % sign in search keyword should not redirect to 404 ERROR.
10 Application should not crash if user inserted % in search field
11 When user start typing word in text box it should suggest words that matches typed keyword
12 There should be pre-defined search criteria for auto complete e.g. after typing first 3 letter it should suggest matching keyword
13 When user clicks on any link from result and navigates back, then result should be maintained
14 After clicking Search field - search history should be displayed (latest search keyword)
15 All search keyword/filters should get cleared on clicking Reset button
16 Search results should be cleared on clicking clear search button
17 Pagination should be tested for searches returning high number of records
18 Total number of search records/results should be displayed on page
19 Search keyword should get highlighted with color in the search results
For ecommerce sites - search keyword should suggest similar kind of product/items
For Advanced Search - limited search filters should be provided
Water text should be provided for user to understand what to search
20 Verify that the response are sorted by relevancy in descending order i.e. most relevant result for the keyword are displayed on top
21 Validate search rules defined for “Exact Match” with the search key word
22 Validate search rules defined for “Similar Match” with the search key word
23 Validate search rules defined to search with a set of keywords
24 User should be able to search when he enters the keyword and hits ‘Enter’ button on keyboard

Logged in search scenarios:
1 History displayed in search field should be relevant to logged in user only
2
**note: only the one with numbers attached will be automated.
