var Themes = {
  // |-----------|
  // |           |
  // |  screen   |
  // |           |
  // |-----------|
  "1x1":[
    // anchor
    "<a href='#' name='{{page_pos}}'></a>",

    // screen
    "<div id='cell-0' style='margin:{{space}}px'></div>",

    "<div class='nehan-reader-clearfix'></div>"
  ].join(""),

  // |----------------|----------------|
  // |                |                |
  // |  left          | right          |
  // |                |                |
  // |----------------|----------------|
  "1x2":[
    // anchor
    "<a href='#' name='{{page_pos}}'></a>",

    // left
    "<div class='nehan-reader-left'>",
    "<div id='cell-0' style='width:{{cell_width}}px; height:{{cell_height}}px; margin-top:{{space}}px; margin-left:{{space}}px; padding-right:{{space}}px;'>",
    "</div>",

    "<div class='nehan-reader-clearfix'></div>",
    "</div>", // left end


    // right
    "<div class='nehan-reader-right'>",
    "<div id='cell-1' style='width:{{cell_width}}px; height:{{cell_height}}px; margin-top:{{space}}px; margin-right:{{space}}px; padding-left:{{space}}px;'>",
    "</div>",

    "<div class='nehan-reader-clearfix'></div>",
    "</div>", // right end

    "<div class='nehan-reader-clearfix'></div>"
  ].join(""),

  // |-----------|
  // |  upside   |
  // |-----------|
  // |  downside |
  // |-----------|
  "2x1":[
    // anchor
    "<a href='#' name='{{page_pos}}'></a>",

    // upside
    "<div id='cell-0' class='nehan-reader-row nehan-reader-row-top' style='width:{{cell_width}}px; height:{{cell_height}}px; margin-top:{{space}}px; margin-left:{{space}}px; padding-bottom:{{space}}px;'>",
    "</div>",

    // downside
    "<div id='cell-1' class='nehan-reader-row nehan-reader-row-bottom' style='height:{{cell_height}}px; padding-top:{{space}}px; margin-left:{{space}}px;'>",
    "</div>",

    "<div class='nehan-reader-clearfix'></div>"
  ].join(""),

  // |----------------|----------------|
  // |  left upside   | right upside   |
  // |----------------|----------------|
  // |  left downside | right downside |
  // |----------------|----------------|
  "2x2":[
    // anchor
    "<a href='#' name='{{page_pos}}'></a>",

    // left
    "<div class='nehan-reader-left'>",

    // left upside
    "<div id='cell-2' class='nehan-reader-row nehan-reader-row-top' style='width:{{cell_width}}px; height:{{cell_height}}px; margin-top:{{space}}px; margin-left:{{space}}px; padding-right:{{space}}px; padding-bottom:{{space}}px'>",
    "</div>",

    // left downside
    "<div id='cell-3' class='nehan-reader-row' style='height:{{cell_height}}px; padding-top:{{space}}px; margin-left:{{space}}px; padding-right:{{space}}px;'>",
    "</div>",

    "<div class='nehan-reader-clearfix'></div>",

    "</div>", // left end

    // right
    "<div class='nehan-reader-right'>",

    // right upside
    "<div id='cell-0' class='nehan-reader-row nehan-reader-row-top' style='width:{{cell_width}}px; height:{{cell_height}}px; margin-top:{{space}}px; margin-right:{{space}}px; padding-left:{{space}}px; padding-bottom:{{space}}px'>",
    "</div>",

    // right downside
    "<div id='cell-1' class='nehan-reader-row' style='height:{{cell_height}}px; padding-top:{{space}}px; margin-right:{{space}}px; padding-left:{{space}}px;'>",
    "</div>",

    "<div class='nehan-reader-clearfix'></div>",

    "</div>", // right end

    "<div class='nehan-reader-clearfix'></div>"
  ].join(""),


  // |-----------|
  // |           |
  // |  screen   |
  // |           |
  // |-----------|
  // |  nombre   |
  // |-----------|
  "1x1-nombre":[
    // anchor
    "<a href='#' name='{{page_pos}}'></a>",

    // screen
    "<div id='cell-0' style='margin:{{space}}px'></div>",

    "<div class='nehan-reader-clearfix'></div>",

    // nombre
    "<div class='nehan-reader-nombre' style='height:{{font_size}}px; line-height:{{font_size}}px; margin-top:{{font_size}}px'>",
    "- {{page_no}} -",
    "</div>"
  ].join(""),

  // |----------------|----------------|
  // |                |                |
  // |  left          | right          |
  // |                |                |
  // |----------------|----------------|
  // |  left nombre   | right nombre   |
  // |----------------|----------------|
  "1x2-nombre":[
    // anchor
    "<a href='#' name='{{page_pos}}'></a>",

    // left
    "<div class='nehan-reader-left'>",
    "<div id='cell-0' style='width:{{cell_width}}px; height:{{cell_height}}px; margin-top:{{space}}px; margin-left:{{space}}px; padding-right:{{space}}px;'>",
    "</div>",

    "<div class='nehan-reader-clearfix'></div>",

    // left nombre
    "<div class='nehan-reader-nombre' style='height:{{font_size}}px; line-height:{{font_size}}px; margin-top:{{font_size}}px'>",
    "- {{left_page_no}} -",
    "</div>",
    "</div>",

    // right
    "<div class='nehan-reader-right'>",
    "<div id='cell-1' style='width:{{cell_width}}px; height:{{cell_height}}px; margin-top:{{space}}px; margin-right:{{space}}px; padding-left:{{space}}px;'>",
    "</div>",

    "<div class='nehan-reader-clearfix'></div>",

    // right nombre
    "<div class='nehan-reader-nombre' style='height:{{font_size}}px; line-height:{{font_size}}px; margin-top:{{font_size}}px'>",
    "- {{right_page_no}} -",
    "</div>",
    "</div>",

    "<div class='nehan-reader-clearfix'></div>"
  ].join(""),

  // |-----------|
  // |  upside   |
  // |-----------|
  // |  downside |
  // |-----------|
  // |  nombre   |
  // |-----------|
  "2x1-nombre":[
    // anchor
    "<a href='#' name='{{page_pos}}'></a>",

    // upside
    "<div id='cell-0' class='nehan-reader-row nehan-reader-row-top' style='width:{{cell_width}}px; height:{{cell_height}}px; margin-top:{{space}}px; margin-left:{{space}}px; padding-bottom:{{space}}px;'>",
    "</div>",

    // downside
    "<div id='cell-1' class='nehan-reader-row nehan-reader-row-bottom' style='height:{{cell_height}}px; padding-top:{{space}}px; margin-left:{{space}}px;'>",
    "</div>",

    "<div class='nehan-reader-clearfix'></div>",

    // nombre
    "<div class='nehan-reader-nombre' style='height:{{font_size}}px; line-height:{{font_size}}px; margin-top:{{font_size}}px'>",
    "- {{page_no}} -",
    "</div>"

  ].join(""),

  // |----------------|----------------|
  // |  left upside   | right upside   |
  // |----------------|----------------|
  // |  left downside | right downside |
  // |----------------|----------------|
  // |  left nombre   | right nombre   |
  // |----------------|----------------|
  "2x2-nombre":[
    // anchor
    "<a href='#' name='{{page_pos}}'></a>",

    // left
    "<div class='nehan-reader-left'>",

    // left upside
    "<div id='cell-2' class='nehan-reader-row nehan-reader-row-top' style='width:{{cell_width}}px; height:{{cell_height}}px; margin-top:{{space}}px; margin-left:{{space}}px; padding-right:{{space}}px; padding-bottom:{{space}}px'>",
    "</div>",

    // left downside
    "<div id='cell-3' class='nehan-reader-row' style='height:{{cell_height}}px; padding-top:{{space}}px; margin-left:{{space}}px; padding-right:{{space}}px;'>",
    "</div>",

    "<div class='nehan-reader-clearfix'></div>",

    // left nombre
    "<div class='nehan-reader-nombre' style='height:{{font_size}}px; line-height:{{font_size}}px; margin-top:{{font_size}}px'>",
    "- {{left_page_no}} -",
    "</div>",
    "</div>", // nehan-reader-left

    // right
    "<div class='nehan-reader-right'>",

    // right upside
    "<div id='cell-0' class='nehan-reader-row nehan-reader-row-top' style='width:{{cell_width}}px; height:{{cell_height}}px; margin-top:{{space}}px; margin-right:{{space}}px; padding-left:{{space}}px; padding-bottom:{{space}}px'>",
    "</div>",

    // right downside
    "<div id='cell-1' class='nehan-reader-row' style='height:{{cell_height}}px; padding-top:{{space}}px; margin-right:{{space}}px; padding-left:{{space}}px;'>",
    "</div>",

    "<div class='nehan-reader-clearfix'></div>",

    // right nombre
    "<div class='nehan-reader-nombre' style='height:{{font_size}}px; line-height:{{font_size}}px; margin-top:{{font_size}}px'>",
    "- {{right_page_no}} -",
    "</div>",
    "</div>", // nehan-reader-right

    "<div class='nehan-reader-clearfix'></div>"
  ].join("")
};
