import React from 'react';
import { Target, Github, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-auto">
      <div className="glass-card m-4 p-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">ValScrims</span>
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-gray-400">
            <span>© 2025 ValScrims. All rights reserved.</span>
            <div className="flex items-center space-x-4">
              <Github className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
              <Twitter className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;