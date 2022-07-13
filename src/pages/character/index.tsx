import { useEffect, useReducer, useState } from "react";
import { useParams } from "react-router-dom";
import ArrowButton from "../../components/arrowButton";
import ComicCard from "../../components/comicCard";
import Loading from "../../components/loading";
import { useFetch } from "../../hooks/useFetch";
import { ComicType, HeroType } from "../../types/HeroType";
import reducerAction from "../../utils/reducerAction";

import "./style.scss";

type DataType = {
  data: {
    results: HeroType[] | ComicType[];
    total: number;
  };
};
//type para o reducer
type ParamsType = {
  limit?: string;
  offset?: string;
};
type StateType = {
  comics: ComicType[] | null;
  total: number;
  index: number;
  comicShown: ComicType | null;
  params: ParamsType;
};
type Action = {
  type: actionKind;
  payload: unknown;
};

const initialParams = {
  limit: "20",
  offset: "0",
};

const initialState: StateType = {
  comics: null,
  total: 0,
  index: 0,
  comicShown: null,
  params: initialParams,
};

enum actionKind {
  setComics = "SET_COMICS",
  setComicShown = "SET_COMIC_SHOWN",
  setTotalComics = "SET_TOTAL_COMICS",
  incrementIndex = "INCREMENT_INDEX",
  decrementIndex = "DECREMENT_INDEX",
}

const reducer = (state: StateType, action: Action): StateType => {
  const { type, payload } = action;

  switch (type) {
    case actionKind.setComics:
      if (!state.comics) {
        return {
          ...state,
          comics: payload as ComicType[],
        };
      }

      return {
        ...state,
        comics: [...state.comics, ...(payload as ComicType[])],
      };

    case actionKind.setTotalComics:
      return {
        ...state,
        total: payload as number,
      };
    case actionKind.incrementIndex: {
      //condicional para requisições 'futuras'
      if (state.index + 10 > Number(state.params.offset) + 20) {
        const newOffset = Number(Number(state.params.offset) + 20).toString();
        return {
          ...state,
          index: state.index++,
          params: { ...state.params, offset: newOffset },
        };
      }
      return {
        ...state,
        index: state.index++,
      };
    }
    case actionKind.decrementIndex:
      return {
        ...state,
        index: state.index--,
      };
    case actionKind.setComicShown:
      return {
        ...state,
        comicShown: state.comics ? state.comics[state.index] : null,
      };

    default:
      return state;
  }
};

function Character() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { comicShown, params, total, index } = state;

  const { id } = useParams();
  const character = useFetch<DataType>(`/characters/${id}`);
  const heroData = character.data?.data.results[0] as HeroType;

  const comics = useFetch<DataType>(`/characters/${id}/comics`, params);
  const comicsDataArray = comics.data?.data.results as ComicType[];
  const totalComics = comics.data?.data.total;

  //setando as comics pré carregadas
  useEffect(() => {
    if (comicsDataArray) {
      dispatch(reducerAction(actionKind.setComics, comicsDataArray));
      dispatch(reducerAction(actionKind.setTotalComics, totalComics));
    }
  }, [comicsDataArray]);

  //setando a comic exibida
  useEffect(() => {
    dispatch(reducerAction(actionKind.setComicShown));
  }, [state.index, state.comics]);

  const handleIncrement = () =>
    dispatch(reducerAction(actionKind.incrementIndex));
  const handleDecrement = () =>
    dispatch(reducerAction(actionKind.decrementIndex));

  console.log(comicsDataArray);

  return (
    <>
      {character.loading && <Loading />}
      {!character.loading && (
        <div className="CharacterContainer">
          <div className="CharacterInternalContainer">
            <div className="comicsContainer">
              {!comicShown && <Loading />}
              {comicShown && (
                <>
                  <ArrowButton
                    handleFunction={handleDecrement}
                    side="left"
                    show={index > 0}
                  />
                  <ComicCard
                    imgUrl={comicShown?.thumbnail.path}
                    linkUrl={comicShown?.urls[0].url}
                    title={comicShown?.title}
                    index={index + 1}
                    total={total + 1}
                  />
                  <ArrowButton
                    handleFunction={handleIncrement}
                    side="right"
                    show={index < total}
                  />
                </>
              )}
            </div>
            <div className="imagesContainer">
              <a href={heroData?.urls[0].url} target="_blank">
                <img
                  src={`${heroData?.thumbnail.path}/portrait_uncanny.jpg`}
                  alt={heroData?.name}
                />
              </a>
              <a href={heroData?.urls[0].url} className="name" target="_blank">
                {heroData?.name}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Character;