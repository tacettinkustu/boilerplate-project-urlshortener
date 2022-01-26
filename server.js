require('dotenv').config();
const express = require('express');
const Mongoose = require('mongoose');
const BodyParser = require('body-parser');
const cors = require('cors');
const dns = require('dns');
const urlParser = require('url');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

Mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const urlModel = Mongoose.model('Url', {
	longUrl: String,
	shortUrl: String,
});

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.get('/api/shorturl/:shortUrl', async (req, res) => {
	try {
		const doc = await urlModel.findOne({ shortUrl: req.params.shortUrl });
		res.redirect(doc.longUrl);
	} catch (error) {
		res.status(500).send(error);
	}
});

// Endpoint for create a new instancee of urls
app.post('/api/shorturl', function (req, res) {
  try {
    const { url: longUrl } = req.body;
    const { hostname } = new URL(longUrl);

    dns.lookup(hostname, async (err) => {
      if (!err) {
        const shortenedUrl = await urlModel.findOne({ longUrl });

        if (shortenedUrl) {
          res.send(getResponse(shortenedUrl));
        } else {
          const shortUrl = makeShortUrl(longUrl);
          const url = new urlModel({ longUrl, shortUrl });
          const doc = await url.save();

          res.send(getResponse(doc));
        }
      } else {
        res.send({ error: 'invalid URL' });
      }
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
