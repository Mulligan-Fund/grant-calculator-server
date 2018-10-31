# Grant Calculator Server
### CORS application to work with the grant calculator.

## Installation
### 1) Update schemas
If you've modified `grantcalc` client in any way, make sure to update the schema on the server side. Do this by running `python ymltodb.py` while making sure the client and server repos are in the same directory (..)
You can also bootstrap 

### 2) Generate Salary List
Run `python salarylist.py` to do this. You'll need the appropriate csv with salary info to get this to work properly. (Not included in repo).

### 3) Run staging server
Make sure your mongodb instance is running (`mongod`). Recommend using Robo 3T or something to debug.

The server itself is running on port 3000, vs. 4000 for the client.
```
node install
node app
```

## Deploy
(Not working)
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)
