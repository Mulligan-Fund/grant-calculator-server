# Grant Calculator Server
### CORS application to work with the grant calculator.

## Installation
### Update schemas
If you've modified `grantcalc` client in any way, make sure to update the schema on the server side. Do this by running `python ymltodb.py` while making sure the client and server repos are in the same directory (..)

### Generate Salary List
Run `python salarylist.py` to do this. You'll need the appropriate csv with salary info to get this to work properly.

### Run staging server
Make sure your mongodb instance is running (`mongod`). Recommend using Robo 3T or something to debug.
```
node install
node app
```

NOTE: NOT COMPLETE
## Instructions
Run `ymltodb.py` pointed at the appropriate yml file in grant calc.
This file will generate the appropriate `schema.js` file with the contents of the yml file.

## Deploy
(Not working)
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)
