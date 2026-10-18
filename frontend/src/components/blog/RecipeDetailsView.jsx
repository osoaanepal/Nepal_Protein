import React, { useState } from 'react';
import { 
  Clock, 
  ChefHat, 
  Users, 
  Flame, 
  CheckSquare, 
  Square, 
  Utensils, 
  Activity, 
  Play, 
  ListOrdered,
  Sparkles
} from 'lucide-react';
import { getEmbedVideoUrl } from '../../utils/blogUtils';

export const RecipeDetailsView = ({ post }) => {
  const [checkedIngredients, setCheckedIngredients] = useState({});

  if (!post) return null;

  const toggleIngredient = (index) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const videoEmbedUrl = post.videoUrl ? getEmbedVideoUrl(post.videoUrl) : null;
  const nutrition = post.nutritionInformation || {};
  const hasNutrition = !!(nutrition.calories || nutrition.protein || nutrition.carbohydrates || nutrition.fats);
  const ingredients = Array.isArray(post.ingredients) ? post.ingredients : [];
  const instructions = Array.isArray(post.instructions) ? post.instructions : [];

  return (
    <div className="space-y-10 my-8">
      
      {/* Recipe Quick Overview Bar */}
      <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-200/80 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-6">
          <ChefHat className="w-6 h-6 text-orange-500" />
          <h3 className="font-display font-bold text-xl text-black">
            Recipe Overview & Timings
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {post.preparationTime && (
            <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm text-center">
              <Clock className="w-5 h-5 text-orange-500 mx-auto mb-1.5" />
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Prep Time</p>
              <p className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">{post.preparationTime}</p>
            </div>
          )}

          {post.cookingTime && (
            <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm text-center">
              <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1.5" />
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cook Time</p>
              <p className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">{post.cookingTime}</p>
            </div>
          )}

          {post.servings && (
            <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm text-center">
              <Users className="w-5 h-5 text-orange-500 mx-auto mb-1.5" />
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Servings</p>
              <p className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">{post.servings}</p>
            </div>
          )}

          {post.difficulty && (
            <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm text-center">
              <Sparkles className="w-5 h-5 text-orange-500 mx-auto mb-1.5" />
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Difficulty</p>
              <p className="text-sm sm:text-base font-bold text-orange-600 mt-0.5">{post.difficulty}</p>
            </div>
          )}
        </div>
      </div>

      {/* Video Recipe Player Section (if available) */}
      {videoEmbedUrl && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-orange-500" />
            <h3 className="font-display font-bold text-xl text-black">
              Video Preparation Guide
            </h3>
          </div>
          <div className="relative aspect-video rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-black">
            <iframe
              src={videoEmbedUrl}
              title={`${post.title} Video Recipe`}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}

      {/* Nutrition Facts Grid (if available) */}
      {hasNutrition && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-black" />
            <h3 className="font-display font-bold text-lg text-black">
              Macro & Nutrition Profile (Per Serving)
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {nutrition.calories && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-xs text-slate-500 font-medium">Calories</span>
                <p className="text-lg font-black text-slate-900 mt-1">{nutrition.calories} <span className="text-xs font-normal text-slate-500">kcal</span></p>
              </div>
            )}
            {nutrition.protein && (
              <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-100 text-center">
                <span className="text-xs text-orange-800 font-semibold">Protein</span>
                <p className="text-lg font-black text-orange-600 mt-1">{nutrition.protein}</p>
              </div>
            )}
            {nutrition.carbohydrates && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-xs text-slate-500 font-medium">Carbohydrates</span>
                <p className="text-lg font-black text-slate-900 mt-1">{nutrition.carbohydrates}</p>
              </div>
            )}
            {nutrition.fats && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-xs text-slate-500 font-medium">Fats</span>
                <p className="text-lg font-black text-slate-900 mt-1">{nutrition.fats}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Two Column Layout: Ingredients & Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Ingredients Column */}
        {ingredients.length > 0 && (
          <div className="lg:col-span-5 bg-slate-50/80 border border-slate-200 rounded-3xl p-6 sm:p-7">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-orange-500" />
                <h3 className="font-display font-bold text-lg text-black">
                  Ingredients
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {ingredients.length} items
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4 italic">
              Tap any item to check off as you prepare:
            </p>

            <ul className="space-y-2.5">
              {ingredients.map((ing, idx) => {
                const isChecked = checkedIngredients[idx];
                return (
                  <li
                    key={idx}
                    onClick={() => toggleIngredient(idx)}
                    className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer select-none transition ${
                      isChecked
                        ? 'bg-emerald-50 text-slate-400 line-through'
                        : 'bg-white hover:bg-orange-50/40 text-slate-800 shadow-sm border border-slate-100'
                    }`}
                  >
                    <div className="mt-0.5 text-orange-500 shrink-0">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                    <div className="text-xs sm:text-sm font-medium leading-snug flex-1">
                      <span className="font-bold text-slate-900">{ing.item}</span>
                      {ing.quantity && <span className="text-orange-600 ml-1.5 font-semibold">({ing.quantity})</span>}
                      {ing.notes && <span className="text-slate-400 text-xs block mt-0.5">{ing.notes}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Step-by-Step Instructions Column */}
        {instructions.length > 0 && (
          <div className={`${ingredients.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
              <ListOrdered className="w-5 h-5 text-orange-500" />
              <h3 className="font-display font-bold text-lg text-black">
                Preparation Instructions
              </h3>
            </div>

            <div className="space-y-4">
              {instructions.map((inst, idx) => (
                <div 
                  key={idx} 
                  className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex items-start gap-4 hover:border-orange-200 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm">
                    {inst.step || idx + 1}
                  </div>
                  <div className="space-y-1 flex-1">
                    {inst.title && (
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        {inst.title}
                      </h4>
                    )}
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                      {inst.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
