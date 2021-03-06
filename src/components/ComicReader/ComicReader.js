import React, {useState, useEffect, useRef} from 'react'

import comicReaderUtils from './Utils';

const GET_LATEST_COMIC_URL = 'https://xkcd.com/info.0.json';
const GET_COMIC_BY_NUM_URL = 'https://xkcd.com/{comicNumber}/info.0.json';

const ComicReader = () => {
  const [comics, setComics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [latestComicNum, setLatestComicNum] = useState(0);
  const inputRef = useRef();

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
      let pageNumbers = [1, 2, 3, 4, 5, 6, 7, '...', latestComicNum];
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
      else if (diff > 4) {
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

  const jumpToComicNum = () => {
    const onInputKeyPress = (event) => {
      //accept only digits
      if (!/[0-9]/.test(event.key)) {
        event.preventDefault();
      }
    };
    const handleComicNumSubmit = (comicNum) => {
      //check user input for: 
      // 1. not empty
      // 2. between 1 and latestComicNum
      if (!comicReaderUtils.isEmpty(comicNum)) {
        comicNum = parseInt(comicNum, 10);
        if (comicNum > 0 && comicNum < latestComicNum) {
          handleComicNav(latestComicNum - (comicNum - 1));
        }
      }
    };
    const onInputKeyUp = (event) => {
      const keyCode = event.which;
      //Enter or Space key
      if (keyCode === 13 || keyCode === 32) {
        handleComicNumSubmit(event.target.value);
      }
    };
    return (
      <div className="comicReader__gotoComic">
        <label htmlFor="gotoComicNum">
          Enter comic number:
        </label>
        <input
          id="gotoComicNum"
          onKeyPress={onInputKeyPress}
          onKeyUp={onInputKeyUp}
          ref={inputRef}
        />
        <button
          aria-label="Enter comic number to jump to"
          type="submit" 
          onClick={() => handleComicNumSubmit(inputRef.current.value)}
        >
          Submit
        </button>
      </div>
    );
  };

  const renderComic = (comic) => {
    if (comic) {
      const { title, month, day, year, img, alt, num} = comic;
      const isLatest = num === latestComicNum;
      const isFirst = num === 1;
      const dateCreated = `${month}/${day}/${year}`;
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
          <div className="comicReader__InfoContainer">
            <div className="title" role="region" aria-label={`Comic Title: ${title}`}>
              <b>Comic Title:</b> {title}
            </div>
            <div className="dateCreated" role="region" aria-label={`Date Created: ${dateCreated}`}>
              <b>Date Created:</b> {dateCreated}        
            </div>
          </div>  
          <div className="comicReader__Carousel">
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
          {renderPagination()}
          {jumpToComicNum()}
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
