const baseUrl = require('../constant/url');
const services = require('../helper/service');
const cheerio = require('cheerio');

const fetchRecipes = (req, res, response) => {
    try {
        const $ = cheerio.load(response.data);
        const element = $('#category-content');
        let title, thumb, duration, servings, dificulty, key, url, href;
        let recipe_list = [];
        element.find('.category-posts');
        element.find('.post-col').each((i, e) => {
            title = $(e).find('a').attr('data-tracking-value');
            thumb = $(e).find('.thumb-wrapper').find('img').attr('data-lazy-src');
            duration = $(e).find('.time').find('small').text();
            servings = $(e).find('.servings').find('small').text();
            dificulty = $(e).find('.difficulty').find('small').text();
            url = $(e).find('a').attr('href');
            href = url.split('/');
            key = href[4];

            recipe_list.push({
                title : title,
                thumb : thumb,
                key : key,
                times : duration,
                portion : servings,
                dificulty : dificulty
            });
        });
        res.send({
            method : req.method,
            status : true,
            results : recipe_list
        });
    } catch (error) {
        throw error;
    }
}

const Controller = {
    newRecipes : async (req, res) => {
        try {
            const response = await services.fetchService(`${baseUrl}/resep-masakan/`);
            return fetchRecipes(req, res, response);
        } catch (error) {
            throw error;
        }
    },

    newRecipesByPage : async (req, res) => {
        try {
            const page = req.params.page;
            const response = await services.fetchService(`${baseUrl}/resep-masakan/?halaman=${page}`);
            return fetchRecipes(req, res, response);
        } catch (error) {
            throw error;
        }
    },

    category : async (req, res) => {
        try {
            const response = await services.fetchService(`${baseUrl}/resep-masakan/`);
            const $ = cheerio.load(response.data);
            const element = $('#sidebar');
            let category, url, key;
            let category_list = [];
            element.find('.explore-by-widget');
            element.find('.category-col').each((i, e) => {
                category = $(e).find('a').attr('data-tracking-value');
                url = $(e).find('a').attr('href');
                const split = category.split(' ');
                if (split.includes('Menu')) split.splice(0, 1);
                const results = Array.from(split).join('-');
                key = results.toLowerCase();
                category_list.push({
                    category : category,
                    url : url,
                    key : key
                });
            });

            return res.send({
                method : req.method,
                status : true,
                results : category_list
            });

        } catch (error) {
            throw error;
        }
    },

    article : async (req, res) => {
        try {
            const response = await services.fetchService(`${baseUrl}/resep-masakan/`);
            const $ = cheerio.load(response.data);
            const element = $('.latest-posts-widget');
            let parse;
            let title, url;
            let article_lists = [];
            element.find('.posts-row');
            element.find('.posts-col').each((i, e) => {
                title = $(e).find('a').attr('data-tracking-value');
                url = $(e).find('a').attr('href');
                parse = url.split('/');
                console.log(parse.length);
                article_lists.push({
                    title : title,
                    url : url,
                    key : parse[3]
                });
            });

            return res.send({
                method : req.method,
                status : true,
                results : article_lists
            });
        } catch (error) {
            throw error;
        }
    },

    recipesByCategory : async (req, res) => {
        try {
            const key = req.params.key;
            const response = await services.fetchService(`${baseUrl}/resep-masakan/${key}`);
            return fetchRecipes(req, res, response);

        } catch (error) {
            throw error;
        }
    },

    recipesCategoryByPage : async (req, res) => {
        try {
            const key = req.params.key;
            const page = req.params.page;
            const response = await services.fetchService(`${baseUrl}/resep-masakan/${key}/?halaman=${page}`);
            return fetchRecipes(req, res, response);
            
        } catch (error) {
            throw error;
        }
    },

    recipesDetail : async (req, res) => {
        try {
            const key = req.params.key;
            const response = await services.fetchService(`${baseUrl}/resep/${key}`);
            const $ = cheerio.load(response.data);
            let metaDuration, metaServings, metaDificulty, metaIngredient;
            let title , thumb, user, datePublished, desc, quantity, ingredient, ingredients;
            let parseDuration, parseServings, parseDificulty, parseIngredient;
            let duration, servings, dificulty;
            let servingsArr = [];
            let difficultyArr = [];
            let object = {};
            const elementHeader = $('#recipe-header');
            const elementDesc = $('.the-content').first();
            const elementNeeded = $('.needed-products');
            const elementIngredients = $('#ingredients-section');
            const elementTutorial = $('#steps-section');
            title = elementHeader.find('.title').text();
            thumb = elementHeader.find('.featured-img').attr('data-lazy-src');
            user = elementHeader.find('small.meta').find('.author').text();
            datePublished = elementHeader.find('small.meta').find('.date').text();

            elementHeader.find('.recipe-info').each((i, e) => {
                metaDuration = $(e).find('.time').find('small').text();
                parseDuration = metaDuration.split('\n')[1].split(' ');
                parseDuration.forEach( r => {
                    if(r !== "") duration = r;
                });
                metaServings = $(e).find('.servings').find('small').text();
                parseServings = metaServings.split('\n')[1].split(' ');
                parseServings.forEach(r => {
                    if(r !== "") servingsArr.push(r);
                });
                servings = Array.from(servingsArr).join(' ');
                metaDificulty = $(e).find('.difficulty').find('small').text();
                parseDificulty = metaDificulty.split('\n')[1].split(' ');
                parseDificulty.forEach(r => {
                    if(r !== "") difficultyArr.push(r);
                });
                dificulty = Array.from(difficultyArr).join(' ');

                object.title = title;
                object.thumb = thumb;
                object.servings = servings;
                object.times = duration;
                object.dificulty = dificulty;
                object.author = {user, datePublished};
            });
            
            elementDesc.each((i, e) => {
                desc = $(e).find('p').text();
                object.desc = desc;
            });

            let thumb_item, need_item;
            let neededArr = [];
            elementNeeded.find('.d-inline-flex').find('.justify-content-around').each((i, e) => {
                thumb_item = $(e).find('.product-img').find('img').attr('data-lazy-src');
                need_item = $(e).find('.product-info').find('.product-name').text();
                neededArr.push({
                    item_name : need_item,
                    thumb_item : thumb_item
                });
            });

            object.needItem = neededArr;

            let ingredientsArr = [];
            elementIngredients.find('.ingredient-groups').find('.ingredients').find('.ingredient-item').each((i, e) => {
                const term = [];
                quantity = $(e).find('.quantity').text();
                metaIngredient = $(e).find('.ingredient').text();
                parseIngredient = metaIngredient.split('\n')[1].split(' ');
                parseIngredient.forEach(r => {
                    if(r !== "") term.push(r);
                });
                ingredient = Array.from(term).join(' ');
                ingredients = `${quantity} ${ingredient}`
                ingredientsArr.push(ingredients)
            });
            
            object.ingredient = ingredientsArr;
            let step, resultStep, thumb_step;
            let stepArr = [];
            elementTutorial.find('.steps').find('.step').each((i, e) => {
                step = $(e).find('.step-description').find('p').text();
                thumb_step = $(e).find('.step-wrapper').find('.step-image-wrapper').find('img').attr('data-lazy-src');
                resultStep = `${i + 1} ${step}`
                stepArr.push({
                    thumb : thumb_step,
                    step : resultStep
                });
            });

            object.step = stepArr;

            res.send({
                method : req.method,
                status : true,
                results : object
            });

        } catch (error) {
            throw error;
        }
    }
}

module.exports = Controller;