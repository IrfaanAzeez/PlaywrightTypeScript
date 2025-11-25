Feature: User API Testing

  @api @sra @regression
  Scenario: Fetch SRA Copy Parameters with valid token
    Given I have the SRA email "irfaan.a@inter.ikea.com"
    When I authenticate with SRA API
    And I send a GET request to fetch SRA Copy Parameters
    Then the SRA response status code should be 200
    And the SRA response should contain data
    And the SRA data should be valid
