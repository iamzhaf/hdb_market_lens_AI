


Ontology for HDB Resale Prices

Estate/Town: Defines the physical boundaries. Example: Choa Chu Kang or Tampines.

Estates in the Western Region: Bukit Batok, Bukit Panjang, Chua Chu Kang, Clementi, Jurong East, Jurong West, Tengah, Tuas, and Woodlands.

Estates in the Northern Region: Sembawang, Yishun, and Woodlands.

Estates in the Eastern Region: Bedok, Geylang, Kallang/Whampoa, Marine Parade, Pasir Ris, Punggol, Tampines, and Hougang.

Estates in the Central Region: Bukit Timah, Central Area, Queenstown, and Southern Ridges.

Building Infrastructure: Details the structure. It maps blocks, void decks, and individual units.

Household: Groups people living in a flat. It includes family size and income brackets.

Amenities: Maps nearby spots. Examples include Hawker Centres, MRT stations, and Clinics

Entities:

Town:

Represents the administrative district where the flat is located.

Examples: Bukit Timah, Jurong West, Kallang/Whampoa.

flat_type:

Categorizes the HDB flat based on its layout and size.

Examples: 3-Room, 4-Room, 5-Room, Executive.

flat_model:

Describes the architectural design or model of the flat.

Examples: Model A, Simplified Maisonette, DBSS, Executive Apartment.

storey_range:

Defines the vertical location of the flat within the block.

Examples: 10 to 12, 22 to 24, 01 to 03.

2. Values

month:

Categorical time dimension representing the month of the transaction.

Format: "YYYY-MM" (e.g., "2023-01").

block:

Unique identifier for a specific residential building.

Format: String (e.g., "504").

street_name:

Name of the street where the block is located.

Examples: "Jurong West Avenue 1", "Bedok Reservoir Road".

floor_area_sqm:

Numerical measure of the usable living space in square meters.

Format: Float (e.g., 64.5, 110.0).

lease_commence_date:

Year when the flat's lease began.

Format: Integer (e.g., 1985, 2012).

resale_price:

Numerical measure of the transaction price in Singapore Dollars.

Format: Float (e.g., 580000.00, 925000.00).
