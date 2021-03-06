import React, {useState, useEffect} from 'react'

import comicReaderUtils from './Utils';

const GET_LATEST_COMIC_URL = 'https://xkcd.com/info.0.json';
const GET_COMIC_BY_NUM_URL = 'https://xkcd.com/{comicNumber}/info.0.json';

const ComicReader = () => {
  const [comics, setComics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [latestComicNum, setLatestComicNum] = useState(0);

  // on component mount, always load the latest comic
  useEffect(() => {
    setIsLoading(true);
    comicReaderUtils
      .proxiedRequest(GET_LATEST_COMIC_URL)
      .then(response => {
          if (!comicReaderUtils.isEmpty(response)) {
            let _comics = [response, ...comics];
            setIsLoading(false);
            setComics(_comics);
            setLatestComicNum(response.num);
          }
        }
      )
      .catch(err => setIsLoading(false));
  }, []);

  const handleComicNav = (comicNum) => {
    if (comicNum) {
      const existingComic = comics.find(comic => comic.num === comicNum);
      // reduce network calls
      // once comic is loaded, it's saved in the state, 
      // reuse that instead of expensive network calls
      if (existingComic) {
        let _comics = [existingComic, ...comics.filter(comic => comic.num !== comicNum)];
        setComics(_comics);
      } else {
        setIsLoading(true);
        comicReaderUtils
          .proxiedRequest(GET_COMIC_BY_NUM_URL.replace('{comicNumber}', comicNum))
          .then(response => {
              if (!comicReaderUtils.isEmpty(response)) {
                let _comics = [response, ...comics];
                setIsLoading(false);
                setComics(_comics);
              }
            }
          )
          .catch(err => setIsLoading(false));
      }
    }
  };

  const renderPagination = () => {
    const currentlyViewedComicNum = comics[0].num;
    const diff = latestComicNum - currentlyViewedComicNum;
    if (diff >= 0) {
      let pageNumbers = [1, 2, 3, 4, 5, 6, 7];
      if (currentlyViewedComicNum > 0 && currentlyViewedComicNum < 5) {
        //handle pagination for last 7 pages
        pageNumbers = [
          1,
          '...',
          latestComicNum - 6,
          latestComicNum - 5,
          latestComicNum - 4,
          latestComicNum - 3,
          latestComicNum - 2,
          latestComicNum - 1,
          latestComicNum
        ];
      }
      else if (diff >= 4) {
        //handle intermediate pagination
        pageNumbers = [
          1,
          '...',
          diff - 2,
          diff - 1,
          diff,
          diff + 1,
          diff + 2,
          diff + 3,
          diff + 4,
          '...',
          latestComicNum
        ];
      }
      return (
        <div className="comicReader__Pagination">
          {pageNumbers.map((ele, idx) => {
            let currentComicNum,
            isDisabled;
            if (typeof ele === 'string') {
              currentComicNum = `int-${idx}`;
              isDisabled = true;
            } else {
              currentComicNum = latestComicNum - (ele - 1);
              isDisabled = comics[0].num + (ele - 1) === latestComicNum;
            }
            return (
              <button
                key={`comicNum-${currentComicNum}`}
                aria-label={`Go to comic ${currentComicNum}`}
                disabled={isDisabled}
                onClick={() => handleComicNav(currentComicNum)}
              >
                {ele}
              </button>
            )
          })}
        </div>
      )
    }
  };

  const renderComic = (comic) => {
    if (comic) {
      const { title, month, day, year, img, alt, num} = comic;
      const isLatest = num === latestComicNum;
      const isFirst = num === 1;
      return (
        <>
          {(isLatest || isFirst)
            && 
            <div 
              aria-label="You're viewing the latest comic."
              className="comicInfo"
            >
              {`You're viewing the ${isLatest ? 'latest' : 'first'} comic.`}
            </div>}
          <div className={`comicReader__Carousel ${isLatest || isFirst ? '' : '-noComicInfo'}`}>
            <button
              aria-label="Click to view previous comic"
              disabled={isLatest}
              onClick={() => handleComicNav(num + 1)}
            >
              {'<'}
            </button>
            <img 
              src={img}
              alt={alt}
            />
            <button 
              aria-label="Click to view next comic"
              disabled={isFirst}
              onClick={() => handleComicNav(num - 1)}>
              {'>'}
            </button>
          </div>
          <div className="comicReader__InfoContainer">
            <div className="title" role="region" aria-label={`Comic Title: ${title}`}>
              <b>Comic Title:</b> {title}
            </div>
            <div className="dateCreated" role="region" aria-label={`Date Created: ${month}/${day}/${year}`}>
              <b>Date Created:</b> {`${month}/${day}/${year}`}        
            </div>
          </div>
          {renderPagination()}
        </>
      );
    }
    return null;
  }
  
  return (
    <div className="comicReader">
      {isLoading 
        ? <div>Loading ...</div>
        : renderComic(comics[0])
       }
    </div>
  )
}

export default React.memo(ComicReader);
