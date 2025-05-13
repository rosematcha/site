import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ItemGrid } from './components/ItemGrid'
import { items as allItems } from './items'
import './App.css'

function App() {
  const [selectedCategory, setSelectedCategory] = useState('All Items')
  const items = allItems;

  // Collect unique categories for filter buttons
  const categories = Array.from(new Set(
    allItems.flatMap(item => (item.category ? item.category.split(',').map(c => c.trim()) : []))
  ));

  return (
    <BrowserRouter basename="/garagesale">
      <div className="garage-sale">
        <header className="header">
          <h1>Online Garage Sale</h1>
          <div className="counter">
            <span className="counter-text">Please take my stuff!</span>
          </div>
        </header>

        <Routes>
          <Route path="/" element={
            <>
              <nav className="categories">
                <button
                  className={`category-btn ${selectedCategory === 'All Items' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('All Items')}
                >All Items</button>
                {categories.map(category => (
                  <button
                    key={category}
                    className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >{category}</button>
                ))}
              </nav>
              <ItemGrid items={items} selectedCategory={selectedCategory} />
            </>
          } />
        </Routes>

        
      </div>
    </BrowserRouter>
  )
}

export default App
