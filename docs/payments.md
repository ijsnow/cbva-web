  The Invoice Field

  The invoice field is just a reference string
  you control - it's your internal identifier
  (order ID, invoice number from your database,  
  etc.). It's:

- Optional (max 11 characters)
- Used to easily retrieve/track transactions
  later
- Stored with the transaction for your
  recordkeeping

  You'd typically pass your database
  order/invoice ID here so you can correlate
  USAePay transactions with your records.

  API Calls You Need

  With a payment_key from pay.js, you only need  
  one API call:

  POST
  <https://sandbox.usaepay.com/api/v2/transactions>

  Minimal Request Body

  {
    "command": "cc:sale",
    "payment_key": "your_payment_key_here",
    "amount": "99.99",
    "invoice": "INV-12345"
  }

  Full Request Body (recommended)

  {
    "command": "cc:sale",
    "payment_key": "your_payment_key_here",
    "amount": "99.99",
    "invoice": "your_db_order_id",
    "amount_detail": {
      "tax": "0.00",
      "subtotal": "99.99"
    },
    "billing_address": {
      "firstname": "John",
      "lastname": "Doe",
      "street": "123 Main St",
      "city": "Austin",
      "state": "TX",
      "postalcode": "78701"
    },
    "custemailaddr": "<customer@example.com>",
    "description": "Membership subscription"
  }

  Response

  {
    "type": "transaction",
    "key": "transaction_key_here",
    "refnum": "123456789",
    "result_code": "A",
    "authcode": "ABC123",
    "auth_amount": 99.99
  }

  Key response values:

- result_code: A = Approved, D = Declined, E =
  Error
- key: Transaction identifier (save this for
  refunds/voids)
- refnum: Reference number

  Complete Workflow

  1. Frontend: pay.js collects card → generates  
  payment_key
  2. Your Server: Receives payment_key + order
  details
  3. Your Server: POST /api/v2/transactions with
  the payment_key
  4. Your Server: Save the transaction key and
  refnum in your database alongside your
  invoice/order

  That's it - one API call to charge the card.

  Sources:

- <https://help.usaepay.info/api/rest/>
- <https://help.usaepay.info/developer/payjs-v2/>
- <https://help.usaepay.info/developer/rest-api/>
  transactions/processing/sale/
