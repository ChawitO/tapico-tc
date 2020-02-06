import React, { Component } from 'react';
import logo from './logo.svg';
import './App.scss';

import axios from 'axios'

class App extends Component {
  state = {
    search: '',
    beers: null,
    year: null,
    trivia: null
  }

  onChange = ({ target: { name, value } }) => {
    this.setState({ [name]: value })
  }

  onSubmit = (e) => {
    e.preventDefault()

    axios
      // Get the brewdog beer API
      .get(`https://api.punkapi.com/v2/beers?beer_name=${this.state.search}`)
      // Get the trivia from another API
      .then(res => Promise.all(res.data.map(beer => {
        const year = beer.first_brewed.split('/')[1]
        return axios.get(`http://numbersapi.com/${year}/year`)
          .then(res => ({ ...beer, trivia: res.data }))
      })))
      // Get the definitions for tagline words
      .then(beers => Promise.all(beers.map(beer => {
        return Promise.all(beer.tagline.split(' ').map(word => this.getDefinitions(word)))
          .then(definitions => ({ ...beer, definitions: definitions}))
      })))
      .then(beers => this.setState({ beers }))
      .catch(err => console.log(err))
  }

  getDefinitions = (word) => {
    word = word.toLowerCase().replace(/\W/, '')
    return axios.get(`https://wordsapiv1.p.rapidapi.com/words/${word}/definitions`, {
      headers: {
        'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com',
        'X-RapidAPI-Key': process.env.REACT_APP_API_KEY
      }
    })
      .then(({ data }) => ({ word: data.word, meaning: `${data.definitions[0].partOfSpeech}. ${data.definitions[0].definition}` }))
      .catch(() => {
        console.log(`Definition of ${word} not found`)
        return { word, meaning: '' }
      })
  }

  render() {
    const { beers, trivia } = this.state
    console.log(beers)
    return (
      <>

        <h1>Tapico TC - Using 3 APIs</h1>

        <form onChange={this.onChange} onSubmit={this.onSubmit}>
          <input name='search' placeholder='search brewdog beer here' />
          <button type='submit'>Search</button>
        </form>

        {beers && beers.map(({ id, name, definitions, description, first_brewed, trivia }) => (
          <div key={id}>
            <h4>{name}</h4>
            <p>{definitions.map(definition => <span key={definition.word} onClick={() => console.log(definition.meaning)}>{definition.word} </span>)}</p>
            <p>{description}</p>
            <p>First brewed: {first_brewed}</p>
            {trivia && <p>Trivia: {trivia}</p>}
          </div>
        ))}

      </>
    )
  }
}

export default App;
