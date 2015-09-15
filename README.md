# aws-lambda-send-ses-email

An AWS Lambda function to send emails using Amazon SES.

The primary purpose of this function is to provide a server-side back-end for sending emails
from static websites.

By using AWS Lambda, we can eliminate the need to host your (almost) static website on
EC2 instances.

## Installation

1. Create an IAM Role for executing AWS Lambda functions. 
2. Give your new IAM Role the following policy:

```
{
    "PolicyName" : "aws-lambda-send-ses-email-policy",
    "PolicyDocument" : {
        "Version" : "2012-10-17",
        "Statement" : [
            {
                "Effect" : "Allow",
                "Action" : [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource" : "arn:aws:logs:*:*:*"
            },
            {
                "Effect" : "Allow",
                "Action" : [
                    "cloudwatch:PutMetricData"
                ],
                "Resource" : "*"
            },
            {
                "Effect" : "Allow",
                "Action" : [
                    "ses:SendEmail"
                ],
                "Resource" : "*"
            },
            {
                "Effect" : "Allow",
                "Action" : [
                    "s3:GetObject"
                ],
                "Resource" : "*"
            }
        ]
    }
}
```

3. Create an S3 bucket to store the email template(s).

4. Create a template file (HTML or text file). A sample file is provided in the `Templates/` folder.

5. Upload the template file to your S3 bucket.

6. Download the latest release ZIP file.

7. Edit `config.js` providing your own details. Put your customized file back into the ZIP file.

8. Create an AWS Lambda function using your custom ZIP file as the source code.

## Usage

Call the Lambda function with any number of properties. The properties will be passed on to the
template file for substitution.

### Notable Parameters

email: This parameter is required. It's used to populate the "Reply-To" field of the email.

name: This parameter is optional, but when omitted, the value from `email` will be used.

### Example 1

Template File:

```
<p>
  Name: {{name}}<br />
  Email: {{email}}<br />
</p>
<p>{{message}}</p>
```

Input Parameters:

```
{
  "name": "John",
  "email": "john@example.com",
  "message": "This is my message"
}
```

## Credits

The following libraries are used:

* AWS SDK for NodeJS
* Markup.js - https://github.com/adammark/Markup.js/