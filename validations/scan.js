var validateAttributeValue = require('./index').validateAttributeValue

exports.types = {
  Limit: {
    type: 'Integer',
    greaterThanOrEqual: 1,
  },
  TotalSegments: {
    type: 'Integer',
    greaterThanOrEqual: 1,
  },
  ReturnConsumedCapacity: {
    type: 'String',
    enum: ['INDEXES', 'TOTAL', 'NONE']
  },
  AttributesToGet: {
    type: 'List',
    lengthGreaterThanOrEqual: 1,
    lengthLessThanOrEqual: 255,
    children: 'String',
  },
  Select: {
    type: 'String',
    enum: ['SPECIFIC_ATTRIBUTES', 'COUNT', 'ALL_ATTRIBUTES', 'ALL_PROJECTED_ATTRIBUTES']
  },
  TableName: {
    type: 'String',
    notNull: true,
    regex: '[a-zA-Z0-9_.-]+',
    lengthGreaterThanOrEqual: 3,
    lengthLessThanOrEqual: 255,
  },
  ExclusiveStartKey: {
    type: 'Map',
    children: {
      type: 'Structure',
      children: {
        S: 'String',
        B: 'Blob',
        N: 'String',
        BS: {
          type: 'List',
          children: 'Blob',
        },
        NS: {
          type: 'List',
          children: 'String',
        },
        SS: {
          type: 'List',
          children: 'String',
        }
      }
    }
  },
  Segment: {
    type: 'Integer',
    greaterThanOrEqual: 0,
  },
  ScanFilter: {
    type: 'Map',
    children: {
      type: 'Structure',
      children: {
        AttributeValueList: {
          type: 'List',
          children: {
            type: 'Structure',
            children: {
              S: 'String',
              B: 'Blob',
              N: 'String',
              BS: {
                type: 'List',
                children: 'Blob',
              },
              NS: {
                type: 'List',
                children: 'String',
              },
              SS: {
                type: 'List',
                children: 'String',
              }
            }
          }
        },
        ComparisonOperator: {
          type: 'String',
          notNull: true,
          enum: ['IN', 'NULL', 'BETWEEN', 'LT', 'NOT_CONTAINS', 'EQ', 'GT', 'NOT_NULL', 'NE', 'LE', 'BEGINS_WITH', 'GE', 'CONTAINS']
        }
      }
    }
  },
}

exports.custom = function(data) {
  var msg = ''
  var lengths = {
    NULL: 0,
    NOT_NULL: 0,
    EQ: 1,
    NE: 1,
    LE: 1,
    LT: 1,
    GE: 1,
    GT: 1,
    CONTAINS: 1,
    NOT_CONTAINS: 1,
    BEGINS_WITH: 1,
    IN: [1],
    BETWEEN: 2,
  }
  var types = {
    EQ: ['S', 'N', 'B'],
    NE: ['S', 'N', 'B'],
    LE: ['S', 'N', 'B'],
    LT: ['S', 'N', 'B'],
    GE: ['S', 'N', 'B'],
    GT: ['S', 'N', 'B'],
    CONTAINS: ['S', 'N', 'B'],
    NOT_CONTAINS: ['S', 'N', 'B'],
    BEGINS_WITH: ['S', 'B'],
    IN: ['S', 'N', 'B'],
    BETWEEN: ['S', 'N', 'B'],
  }
  for (var key in data.ScanFilter) {
    var comparisonOperator = data.ScanFilter[key].ComparisonOperator
    var attrValList = data.ScanFilter[key].AttributeValueList || []
    for (var i = 0; i < attrValList.length; i++) {
      msg = validateAttributeValue(attrValList[i])
      if (msg) return msg
    }

    if ((typeof lengths[comparisonOperator] == 'number' && attrValList.length != lengths[comparisonOperator]) ||
        (attrValList.length < lengths[comparisonOperator][0] || attrValList.length > lengths[comparisonOperator][1]))
      return 'The attempted filter operation is not supported for the provided filter argument count'

    if (types[comparisonOperator] &&
        attrValList.some(function(attrVal) { return !~types[comparisonOperator].indexOf(Object.keys(attrVal)[0]) }))
      return 'The attempted filter operation is not supported for the provided type'
  }

  if (data.ExclusiveStartKey) {
    for (key in data.ExclusiveStartKey) {
      msg = validateAttributeValue(data.ExclusiveStartKey[key])
      if (msg) return 'The provided starting key is invalid: ' + msg
    }
  }

  if (data.AttributesToGet) {
    var attrs = Object.create(null)
    for (var i = 0; i < data.AttributesToGet.length; i++) {
      if (attrs[data.AttributesToGet[i]])
        return 'One or more parameter values were invalid: Duplicate value in attribute name: ' +
          data.AttributesToGet[i]
      attrs[data.AttributesToGet[i]] = true
    }
  }
}

