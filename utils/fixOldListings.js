require("dotenv").config();
const mongoose = require("mongoose");
const Listing = require("../models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

mongoose.connect(MONGO_URL)
  .then(() => console.log("DB connected"))
  .catch(err => console.log(err));

const fixListings = async () => {
  const listings = await Listing.find({ geometry: { $exists: false } });

  console.log(`Found ${listings.length} listings without geometry`);

  for (let listing of listings) {
    try {
      let response = await geocodingClient.forwardGeocode({
        query: listing.location,
        limit: 1
      }).send();

      if (response.body.features.length) {
        listing.geometry = response.body.features[0].geometry;
        await listing.save();
        console.log(`Fixed: ${listing.title}`);
      } else {
        console.log(`No results for: ${listing.location}`);
      }
    } catch (e) {
      console.log(`Error fixing ${listing.title}`, e.message);
    }
  }

  mongoose.connection.close();
};

fixListings();
