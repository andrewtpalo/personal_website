import React, { Component } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams
} from "react-router-dom";
import ReactGA from 'react-ga';
import $ from 'jquery';
import './App.css';
import Header from './Components/Header';
import Footer from './Components/Footer';
import About from './Components/About';
import Resume from './Components/Resume';
import Contact from './Components/Contact';
import Testimonials from './Components/Testimonials';
import Portfolio from './Components/Portfolio';

class App extends Component {

  constructor(props){
    super(props);
    this.state = {
      foo: 'bar',
      resumeData: {}
    };

    ReactGA.initialize('UA-110570651-1');
    ReactGA.pageview(window.location.pathname);

  }

  getResumeData(){
    $.ajax({
      url:'/resumeData.json',
      dataType:'json',
      cache: false,
      success: function(data){
        this.setState({resumeData: data});
      }.bind(this),
      error: function(xhr, status, err){
        console.log(err);
        alert(err);
      }
    });
  }

  componentDidMount(){
    this.getResumeData();
  }

  render() {
    
    return (
      <Router>

      <Routes>
      <Route path="/" element={
             <div className="App">
            <Header data={this.state.resumeData.main}/>
            <About data={this.state.resumeData.main}/>
            <Resume data={this.state.resumeData.resume}/>
            <Portfolio data={this.state.resumeData.portfolio}/>
            <Testimonials data={this.state.resumeData.testimonials}/>
            <Contact data={this.state.resumeData.main}/>
            <Footer data={this.state.resumeData.main}/>
            </div>
          }>
          </Route> 
    
        <Route exact path="/manda" element={
        <body>
          <div class="message">
          <br/><br/><p class='signature'> MAnda,</p><p>You are the love of my life and the reason I wake up every morning. Every moment I spend with you is a moment filled with joy and passion. Your touch, your kiss, and your embrace set my soul on fire and leave me craving more.
You are the most beautiful, intelligent, and loving person I have ever met, and I am so lucky to have you by my side. I am grateful for every moment we spend together, and I can't wait to see what the future holds for us.
Doesn't matter if it's Powell, Green, or even Chicago, I am always excited try new things together because you create memories that last a lifetime.
You are my everything, and I love you more than words could ever express.<br/><br/><p class='signature'> -Z❤</p></p>
          </div>          
      
        </body>
        }
    >
          </Route>
        </Routes>

      </Router>
    );
  }
}

export default App;
