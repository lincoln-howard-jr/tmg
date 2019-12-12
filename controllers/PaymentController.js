let stripeTestKey = 'sk_test_7ChglsnHUd1IgEVd8pfDP6Ac00Ljg3uY0A';
const stripe = require ('stripe') (stripeTestKey);

let router = require ('express').Router ();

const getStripeUser = async (req, res, next) => {
  try {
    if (!req.user) return res.status (401).end ();
    let customer = false;
    if (req.user.stripeCustomerId) customer = await stripe.customers.retrieve (req.user.stripeCustomerId);
    if (!customer) {
      customer = await stripe.customers.create ({email: req.user.email, description: `Congress member ${req.user.first} ${req.user.last}`});
      req.user.stripeCustomerId = customer.id;
      await req.user.save ();
    }
    req.customer = customer;
    next ();
  } catch (e) {
    console.log (e);
    res.status (500).json ({
      e,
      text: 'error in get-stripe-user middleware'
    })
  }
}

router.get ('/payments/methods', getStripeUser, async (req, res) => {
  res.json (req.customer.sources.data);
});

//
router.post ('/payments/methods', getStripeUser, async (req, res) => {
  // t/c
  try {
    // attach source to customer
    await stripe.customers.createSource  (req.customer.id, {source: req.body.token.id});
    res.json ({success: true, reason: 'source attached'});
  } catch (e) {
    console.log (e);
    res.status (500).json ({success: false, reason: e});
  }
});

router.post ('/payments', getStripeUser, async (req, res) => {
  // t/c
  try {
    // check that the user is not subscribed already
    if (req.user.subscribed) return res.status (400).json ({success: false, reason: 'already subscribed'});
    // update user stuffz
    req.user.subscribed = true;
    req.user.paidThrough = {
      month: new Date ().getMonth (),
      year: new Date ().getFullYear () + 1
    }
    await req.user.save ();
    // user must be logged in because of middleware
    await stripe.subscriptions.create ({
      customer: req.customer.id,
      items: [
        {
          plan: 'gwc'
        }
      ]
    });
    res.json ({success: true});
  } catch (e) {
    console.log (e);
    res.status (500).json ({success: false, reason: e});
  }
});

router.delete ('/payments', getStripeUser, async (req, res) => {
  // t/c
  try {
    req.user.subscribed = false;
    await req.user.save ()
    req.customer.subscriptions.data.forEach(sub => {
      stripe.subscriptions.update (sub.id, {cancel_at_period_end: true});
    });
    res.json ('');
  } catch (e) {
    console.log (e);
    res.status (500).json ({success: false, reason: e});
  }
})
// retrieve balance for stripe stuff
router.get ('/balance', async (req, res) => {
  // t/c
  try {
    stripe.balance.retrieve ((err, balance) => {
      if (err) return res.status (500).json (err);
      res.json (balance);
    });
  } catch (e) {

  }
});

module.exports = router;