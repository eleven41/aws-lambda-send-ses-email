console.log('Version 0.1.3');

var aws = require('aws-sdk');

var ses = new aws.SES();
var s3 = new aws.S3();

exports.handler = function (event, context) {
    
    console.log("Event: " + JSON.stringify(event));
    
    // Check required parameters
    if (event.email == null) {
        context.fail('Bad Request: Missing required member: email');
        return;
    }

    var config = require('./config.js');
    
    // Make sure some expected results are present
    if (event.name == null) {
        event.name = event.email;
    }
    
    // Make sure we have a subject.
    // If the event didn't include it, then
    // pull it from the configuration.
    // If we still don't have a subject, then
    // just make one up.
    if (event.subject == null) {
        event.subject = config.defaultSubject;
        
        if (event.subject == null) {
            event.subject = "Mail from {{name}}";
        }
    }
    
    console.log('Loading template from ' + config.templateKey + ' in ' + config.templateBucket);

    // Read the template file
    s3.getObject({
        Bucket: config.templateBucket, 
        Key: config.templateKey
    }, function (err, data) {
        if (err) {
            // Error
            console.log(err, err.stack);
            context.fail('Internal Error: Failed to load template from s3.')
        } else {
            var templateBody = data.Body.toString();
            console.log("Template Body: " + templateBody);
            
            // Convert newlines in the message
            if (event.message != null) {
                event.message = event.message
                .replace("\r\n", "<br />")
                .replace("\r", "<br />")
                .replace("\n", "<br />");
            }

            // Perform the substitutions
            var mark = require('markup-js');
            
            var subject = mark.up(event.subject, event);
            console.log("Final subject: " + subject);
            
            var message = mark.up(templateBody, event);
            console.log("Final message: " + message);
            
            var params = {
                Destination: {
                    ToAddresses: [
                        config.targetAddress
                    ]
                },
                Message: {
                    
                    Subject: {
                        Data: subject,
                        Charset: 'UTF-8'
                    }
                },
                Source: config.fromAddress,
                ReplyToAddresses: [
                    event.name + '<' + event.email + '>'
                ]
            };
            
            var fileExtension = config.templateKey.split(".").pop();
            if (fileExtension.toLowerCase() == 'html') {
                params.Message.Body = {
                    Html: {
                        Data: message,
                        Charset: 'UTF-8'
                    }
                };
            } else if (fileExtension.toLowerCase() == 'txt') {
                params.Message.Body = {
                    Text: {
                        Data: message,
                        Charset: 'UTF-8'
                    }
                };
            } else {
                context.fail('Internal Error: Unrecognized template file extension: ' + fileExtension);
                return;
            }

            // Send the email
            ses.sendEmail(params, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                    context.fail('Internal Error: The email could not be sent.');
                } else {
                    console.log(data);           // successful response
                    context.succeed('The email was successfully sent to ' + event.email);
                }
            });
        }
    });
};
