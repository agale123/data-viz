# March Madness

## Preview

The website at the main branch of this repository can be previewed [here](https://agale123.github.io/data-viz/march-madness/web/).

## Data

Data for years before 2016 is from the [FiveThirtyEight Github](https://github.com/fivethirtyeight/data/tree/master/ncaa-womens-basketball-tournament). Data for 2016-present is from the [NCAA website](https://www.ncaa.com/brackets/basketball-women/d1/2022).

* `recent_matches.csv` contains data for the 2016-present data from NCAA
* `ncaa-womens-basketball-tournament-history.csv` contains the older data from FiveThirtyEight.

## Development

### Data pipeline

Data is downloaded from the NCAA website via the `data_scraping.ipynb` Jupyter
notebook.

The two datasets are merged in `data_merging.ipynb`. This notebook consumes `team_mapping.csv` which is a mapping between the university names in the FiveThirtyEight (old) dataset and the NCAA (new) dataset. One cell of the script prints out the list of teams that are in the new dataset but not the old dataset after performing a mapping from `team_mapping.csv`.

### Website

To test the website locally `cd` into the `web` directory and run:

```
python -m http.server
```

Then visit the site at `localhost:8000`.
