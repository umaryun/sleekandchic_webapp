-- "Nassarawa" was a misspelt duplicate of Nasarawa in a different zone. Checkout
-- always sends "Nasarawa", so removing it doesn't change any price.
DELETE FROM "shipping_rates" WHERE "state" = 'Nassarawa';
