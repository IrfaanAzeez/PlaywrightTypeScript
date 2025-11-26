Feature: User API Testing

  @api @sra @regression
  Scenario: Fetch Education Details with JWT token
    Given Generate JWT token
    Then Use the token to get the Education details using education end point
    And Verify the status code should be 200
    And Print the response payload we are getting in Json file
    And Verify the Order id should be equal to 8345413
