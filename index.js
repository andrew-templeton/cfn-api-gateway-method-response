
var AWS = require('aws-sdk');
var CfnLambda = require('cfn-lambda');

var APIG = new AWS.APIGateway({apiVersion: '2015-07-09'});

var Delete = CfnLambda.SDKAlias({
  api: APIG,
  method: 'deleteMethodResponse',
  keys: ['HttpMethod', 'ResourceId', 'RestApiId', 'StatusCode'],
  downcase: true,
  ignoreErrorCodes: [404]
});

var Upsert = CfnLambda.SDKAlias({
  api: APIG,
  method: 'putMethodResponse',
  downcase: true,
  forceBools: ['ResponseParameters.*'],
  returnPhysicalId: function(data, params) {
    return [
      params.RestApiId,
      params.ResourceId,
      params.HttpMethod,
      params.StatusCode
    ].join(':');
  }
});

exports.handler = CfnLambda({
  Create: Upsert,
  Update: Upsert,
  Delete: Delete,
  SchemaPath: [__dirname, 'schema.json']
});
