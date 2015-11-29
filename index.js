
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

var Upsert = function(params, reply, existingId) {
  CfnLambda.SDKAlias({
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
  })(params, function(createErr, createPhysical, createInfo) {
    if (existingId && createErr &&
      createErr.message === 'Response already exists for this resource') {
      console.log('Method already exists, which is fine: %j', createErr);
      return reply(null, existingId);
    }
    reply(createErr, createPhysical, createInfo);
  });
}

exports.handler = CfnLambda({
  Create: Upsert,
  Update: function(physicalId, params, oldParams, reply) {
    Delete(physicalId, oldParams, function(deleteErr) {
      if (deleteErr) {
        console.error('Could not delete old MethodResponse %s: %j', physicalId, deleteErr);
        return reply('Could not delete old MethodResponse: ' +
          (deleteErr.message || 'FATAL'));
      }
      console.log('Was able to delete old version of this resource. Proceeding with Upsert.');
      Upsert(params, reply, physicalId);
    });
  },
  Delete: Delete,
  SchemaPath: [__dirname, 'schema.json']
});
